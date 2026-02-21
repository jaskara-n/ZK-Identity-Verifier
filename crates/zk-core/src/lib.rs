use chrono::{DateTime, Datelike, NaiveDate, Utc};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use thiserror::Error;
use uuid::Uuid;

pub type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofPayload {
    pub session_id: Uuid,
    pub verifier_id: String,
    pub age_threshold: u32,
    pub statement: String,
    pub nullifier: String,
    pub issued_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proof {
    pub proof_id: Uuid,
    pub payload: ProofPayload,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub verified: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgeProofInput {
    pub session_id: Uuid,
    pub verifier_id: String,
    pub age_threshold: u32,
    pub birth_date: String,
    pub passport_number: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyAgeProofInput {
    pub session_id: Uuid,
    pub verifier_id: String,
    pub age_threshold: u32,
    pub passport_number: String,
    pub proof: Proof,
}

#[derive(Debug, Error)]
pub enum AgeProofError {
    #[error("invalid birth date")]
    InvalidBirthDate,
    #[error("age threshold not met")]
    AgeThresholdNotMet,
}

#[derive(Debug, Error)]
pub enum ProofError {
    #[error("invalid signature")]
    InvalidSignature,
    #[error("payload mismatch")]
    PayloadMismatch,
}

pub trait ProofEngine: Send + Sync {
    fn generate_proof(&self, payload: ProofPayload) -> Proof;
    fn verify_proof(
        &self,
        proof: &Proof,
        expected: &ProofPayload,
    ) -> Result<VerificationResult, ProofError>;
}

#[derive(Clone)]
pub struct MockProofEngine {
    secret: String,
}

impl MockProofEngine {
    pub fn new(secret: impl Into<String>) -> Self {
        Self {
            secret: secret.into(),
        }
    }

    fn sign(&self, payload: &ProofPayload) -> String {
        let mut mac = HmacSha256::new_from_slice(self.secret.as_bytes())
            .expect("HMAC can take key of any size");
        let data = serde_json::to_vec(payload).expect("payload to serialize");
        mac.update(&data);
        hex::encode(mac.finalize().into_bytes())
    }
}

impl ProofEngine for MockProofEngine {
    fn generate_proof(&self, payload: ProofPayload) -> Proof {
        let signature = self.sign(&payload);
        Proof {
            proof_id: Uuid::new_v4(),
            payload,
            signature,
        }
    }

    fn verify_proof(
        &self,
        proof: &Proof,
        expected: &ProofPayload,
    ) -> Result<VerificationResult, ProofError> {
        let expected_signature = self.sign(&proof.payload);
        if expected_signature != proof.signature {
            return Ok(VerificationResult {
                verified: false,
                reason: Some(ProofError::InvalidSignature.to_string()),
            });
        }

        let matches = proof.payload.session_id == expected.session_id
            && proof.payload.verifier_id == expected.verifier_id
            && proof.payload.age_threshold == expected.age_threshold
            && proof.payload.nullifier == expected.nullifier;

        if !matches {
            return Ok(VerificationResult {
                verified: false,
                reason: Some(ProofError::PayloadMismatch.to_string()),
            });
        }

        Ok(VerificationResult {
            verified: true,
            reason: None,
        })
    }
}

pub fn sha256_hex(value: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn generate_age_proof<E: ProofEngine>(
    engine: &E,
    input: AgeProofInput,
) -> Result<Proof, AgeProofError> {
    let birth = NaiveDate::parse_from_str(&input.birth_date, "%Y-%m-%d")
        .map_err(|_| AgeProofError::InvalidBirthDate)?;
    let now = Utc::now().date_naive();
    let mut age = now.year() - birth.year();
    if now.ordinal() < birth.ordinal() {
        age -= 1;
    }
    if age < input.age_threshold as i32 {
        return Err(AgeProofError::AgeThresholdNotMet);
    }

    let nullifier = sha256_hex(&format!("{}:{}", input.session_id, input.passport_number));

    let payload = ProofPayload {
        session_id: input.session_id,
        verifier_id: input.verifier_id,
        age_threshold: input.age_threshold,
        statement: format!("age >= {}", input.age_threshold),
        nullifier,
        issued_at: Utc::now(),
    };

    Ok(engine.generate_proof(payload))
}

pub fn verify_age_proof<E: ProofEngine>(
    engine: &E,
    input: VerifyAgeProofInput,
) -> Result<VerificationResult, ProofError> {
    let expected = ProofPayload {
        session_id: input.session_id,
        verifier_id: input.verifier_id,
        age_threshold: input.age_threshold,
        statement: format!("age >= {}", input.age_threshold),
        nullifier: sha256_hex(&format!("{}:{}", input.session_id, input.passport_number)),
        issued_at: input.proof.payload.issued_at,
    };

    engine.verify_proof(&input.proof, &expected)
}
