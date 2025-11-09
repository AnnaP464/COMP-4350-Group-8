import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:4000";
const PROFILE_ENDPOINT = `${API_URL}/v1/users/me/profile`;
const serverErrorMsg = "Couldn't update your profile. Try again.";


//helper to upload
async function uploadAvatar(file: File): Promise<string> {
  const token = localStorage.getItem("access_token");
  if (!token) 
    throw new Error("Not logged in");
  
  const fd = new FormData();
  fd.append("avatar", file);
  
  const res = await fetch(`${API_URL}/v1/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) 
    throw new Error(await res.text().catch(() => "Upload failed"));
  
  const { avatarUrl } = await res.json();
  return avatarUrl;
}

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user?: {
    bio?: string;
    phone?: string;
    city?: string;
    country?: string;
    avatarUrl?: string;
    contactPref?: "email" | "phone" | "none";
  };
}

type FormState = {
  bio: string;
  phone: string;
  city: string;
  country: string;
  avatarUrl: string;
  contactPref: "email" | "phone" | "none";
};

const DEFAULTS: FormState = {
  bio: "",
  phone: "",
  city: "",
  country: "",
  avatarUrl: "",
  contactPref: "email",
};

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ open, onClose, user }) => {
  const [form, setForm] = useState<FormState>({
    ...DEFAULTS,
    bio: user?.bio ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    country: user?.country ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    contactPref: (user?.contactPref as FormState["contactPref"]) ?? "email",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Optional: when dialog opens, fetch latest profile to prefill (in case props are stale)
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(PROFILE_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const p = await res.json();
          setForm({
            bio: p.bio ?? "",
            phone: p.phone ?? "",
            city: p.city ?? "",
            country: p.country ?? "",
            avatarUrl: p.avatarUrl ?? "",
            contactPref: (p.contactPref as FormState["contactPref"]) ?? "email",
          });
        }
      } catch {
        // ignore: keep whatever we had from props
      }
    })();
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(PROFILE_ENDPOINT, {
        method: "PATCH", // use PUT if you want full replace
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Only send fields your backend expects (camelCase)
        body: JSON.stringify({
          bio: form.bio,
          phone: form.phone,
          city: form.city,
          country: form.country,
          avatarUrl: form.avatarUrl,
          contactPref: form.contactPref,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Request failed");
      }

      alert("Profile updated successfully!");
      onClose();
    } catch (err) {
      console.error("User profile update error", err);
      setErrorMsg(serverErrorMsg);
      alert("Network or validation error — could not update your profile.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent closing when clicking inside the card
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card" onClick={stop}>
        <h2>Edit Profile</h2>
        {errorMsg && <p className="errorMsg">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="edit-form">
          <label>
            Bio
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about yourself…"
            />
          </label>

          <label>
            Phone
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g., +1 204-555-1234"
            />
          </label>

          <label>
            City
            <input type="text" name="city" value={form.city} onChange={handleChange} />
          </label>

          <label>
            Country
            <input type="text" name="country" value={form.country} onChange={handleChange} />
          </label>

          <label>
            Avatar
            <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                const file = e.target.files?.[0] || null;
                if (!file) 
                    return;
                if (file.size > 2 * 1024 * 1024) {
                    alert("Max file size is 2MB");
                    return;
                }
                try {
                    setUploading(true);
                    const url = await uploadAvatar(file);
                    setForm((prev) => ({ ...prev, avatarUrl: url }));
                    setAvatarFile(file);
                } catch (err) {
                    console.error(err);
                    alert("Failed to upload image");
                } finally {
                    setUploading(false);
                }
                }}
            />
            </label>
            
            {form.avatarUrl && (
            <div style={{ marginTop: 8 }}>
                <img src={form.avatarUrl} alt="Avatar preview" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
            </div>
            )}    

          <label>
            Contact Preference
            <select name="contactPref" value={form.contactPref} onChange={handleChange}>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="none">None</option>
            </select>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileDialog;
