import "../css/ProfilePreview.css";
import React, { useEffect, useState } from "react";
import * as UserService from "../services/UserService";

const serverErrorMsg = "Couldn't update your profile. Try again.";

// helper to upload avatar
async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await UserService.getAvatar(formData);

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
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch latest profile when dialog opens
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const res = await UserService.fetchProfile();
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
        /* ignore */
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

  //
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await UserService.fetchProfile();

      if (!res.ok)
        throw new Error(await res.text().catch(() => "Request failed"));
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("User profile update error", err);
      setErrorMsg(serverErrorMsg);
      alert("Network or validation error — could not update your profile.");
    } finally {
      setLoading(false);
    }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card profile-preview" onClick={stop}>
        <div className="profile-header">
          <h2>Your Profile</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit
            </button>
          ) : (
            <button onClick={() => setIsEditing(false)} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>

          {/* the whole page is basically a form */}
        <form onSubmit={handleSubmit} className="profile-form">

          {/* Avatar */}
          <div className="profile-preview">
            {form.avatarUrl && (
              <img
                src={form.avatarUrl}
                alt="Avatar preview"
                className="profile-avatar"
              />
            )}
            {isEditing && (
              <label className="upload-btn">
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) 
                      return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Max file size is 2MB");
                      return;
                    }
                    try {
                      setUploading(true);
                      const url = await uploadAvatar(file);
                      setForm((p) => ({ ...p, avatarUrl: url }));
                    } catch (err) {
                      alert("Failed to upload image");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Profile info fields */}
          <div className="profile-fields">

              {/* BIO */}
              <div className="profile-field">
                <label className="profile-label" htmlFor="bio">Bio</label>
                {!isEditing ? (
                  <span className="profile-value bio-preview">{form.bio || "No bio provided."}</span>
                ) : (
                  <textarea
                    id="bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    className="profile-input"
                    placeholder="Tell people a bit about yourself…"
                  />
                )}
              </div>

              {/* Phone */}
              <div className="profile-field">
                <label className="profile-label" htmlFor="phone">Phone</label>
                {!isEditing ? (
                  <span className="profile-value">{form.phone || "—"}</span>
                ) : (
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="profile-input"
                  />
                )}
              </div>


              {/* City */}
              <div className="profile-field">
                <label className="profile-label" htmlFor="city">City</label>
                {!isEditing ? (
                  <span className="profile-value">{form.city || "—"}</span>
                ) : (
                  <input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="profile-input"
                  />
                )}
              </div>

              {/* Country */}
              <div className="profile-field">
                <label className="profile-label" htmlFor="country">Country</label>
                {!isEditing ? (
                  <span className="profile-value">{form.country || "—"}</span>
                ) : (
                  <input
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="profile-input"
                  />
                )}
              </div>
          </div>

          {/* Save button */}
          {isEditing && (
            <div className="profile-actions">
              <button type="submit" disabled={loading || uploading}>
                {loading || uploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditProfileDialog;
