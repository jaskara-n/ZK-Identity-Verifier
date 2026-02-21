use napi::bindgen_prelude::*;
use napi_derive::napi;
use uuid::Uuid;

use zk_core::{
    generate_age_proof, verify_age_proof, AgeProofError, AgeProofInput, MockProofEngine,
    VerifyAgeProofInput,
};

#[napi(object)]
pub struct ProofPayloadDto {
    pub sessionId: String,
    pub verifierId: String,
    pub ageThreshold: u32,
    pub statement: String,
    pub nullifier: String,
    pub issuedAt: String,
}

#[napi(object)]
pub struct ProofDto {
    pub proofId: String,
    pub payload: ProofPayloadDto,
    pub signature: String,
}

#[napi(object)]
pub struct GenerateProofInputDto {
    pub sessionId: String,
    pub verifierId: String,
    pub ageThreshold: u32,
    pub birthDate: String,
    pub passportNumber: String,
    pub secret: String,
}

#[napi(object)]
pub struct VerifyProofInputDto {
    pub sessionId: String,
    pub verifierId: String,
    pub ageThreshold: u32,
    pub passportNumber: String,
    pub proof: ProofDto,
    pub secret: String,
}

#[napi(object)]
pub struct VerificationResultDto {
    pub verified: bool,
    pub reason: Option<String>,
}

fn to_dto(proof: zk_core::Proof) -> ProofDto {
    ProofDto {
        proofId: proof.proof_id.to_string(),
        payload: ProofPayloadDto {
            sessionId: proof.payload.session_id.to_string(),
            verifierId: proof.payload.verifier_id,
            ageThreshold: proof.payload.age_threshold,
            statement: proof.payload.statement,
            nullifier: proof.payload.nullifier,
            issuedAt: proof.payload.issued_at.to_rfc3339(),
        },
        signature: proof.signature,
    }
}

fn from_dto(dto: ProofDto) -> Result<zk_core::Proof> {
    let payload = zk_core::ProofPayload {
        session_id: Uuid::parse_str(&dto.payload.sessionId)
            .map_err(|_| Error::from_reason("invalid session_id"))?,
        verifier_id: dto.payload.verifierId,
        age_threshold: dto.payload.ageThreshold,
        statement: dto.payload.statement,
        nullifier: dto.payload.nullifier,
        issued_at: dto
            .payload
            .issuedAt
            .parse()
            .map_err(|_| Error::from_reason("invalid issued_at"))?,
    };

    Ok(zk_core::Proof {
        proof_id: Uuid::parse_str(&dto.proofId)
            .map_err(|_| Error::from_reason("invalid proof_id"))?,
        payload,
        signature: dto.signature,
    })
}

#[napi]
pub fn generate_proof(input: GenerateProofInputDto) -> Result<ProofDto> {
    let engine = MockProofEngine::new(input.secret);
    let payload = AgeProofInput {
        session_id: Uuid::parse_str(&input.sessionId)
            .map_err(|_| Error::from_reason("invalid session_id"))?,
        verifier_id: input.verifierId,
        age_threshold: input.ageThreshold,
        birth_date: input.birthDate,
        passport_number: input.passportNumber,
    };

    let proof = generate_age_proof(&engine, payload).map_err(|err| match err {
        AgeProofError::InvalidBirthDate => Error::from_reason("invalid birth_date"),
        AgeProofError::AgeThresholdNotMet => Error::from_reason("age threshold not met"),
    })?;

    Ok(to_dto(proof))
}

#[napi]
pub fn verify_proof(input: VerifyProofInputDto) -> Result<VerificationResultDto> {
    let engine = MockProofEngine::new(input.secret);
    let proof = from_dto(input.proof)?;
    let payload = VerifyAgeProofInput {
        session_id: Uuid::parse_str(&input.sessionId)
            .map_err(|_| Error::from_reason("invalid session_id"))?,
        verifier_id: input.verifierId,
        age_threshold: input.ageThreshold,
        passport_number: input.passportNumber,
        proof,
    };

    let result = verify_age_proof(&engine, payload)
        .map_err(|err| Error::from_reason(err.to_string()))?;

    Ok(VerificationResultDto {
        verified: result.verified,
        reason: result.reason,
    })
}
