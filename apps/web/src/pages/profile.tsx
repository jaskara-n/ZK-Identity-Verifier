import { useState, useEffect } from "react";
import { useAuth } from "@/context/authcontext";

const ProfileForm = () => {
  const { user, loading } = useAuth();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    aadhaar: "",
    passport: "",
    age: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        email: user.email,
        phone: "",
        aadhaar: "",
        passport: "",
        age: "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    alert("Form data saved to console!");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4"
      >

        <div className="flex justify-end">
  <button
    type="button"
    onClick={() => (window.location.href = "/")} // go back to home
    className="text-blue-700 font-bold text-xl hover:text-blue-900"
  >
X
  </button>
</div>
        <h1 className="text-2xl font-bold text-blue-700 mb-4">My Profile</h1>

        <label className="text-blue-700">Display Name</label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled
        />

        <label className="text-blue-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled
        />

        <label className="text-blue-700">Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="text-blue-700">Aadhaar Number</label>
        <input
          type="text"
          name="aadhaar"
          value={formData.aadhaar}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="text-blue-700">Passport Number</label>
        <input
          type="text"
          name="passport"
          value={formData.passport}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="text-blue-700">Age (18+)</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          min={18}
          onChange={handleChange}
          className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow mt-2"
        >
          Save
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
