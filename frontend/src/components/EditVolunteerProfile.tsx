import React, {useState} from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:4000";
const serverErrorMsg = "Couldn't update your profile. Try again.";

interface EditProfileDialogProps{
    open: boolean;
    onClose: () => void;
    user: {
        username: string, 
        email?: string,
        phone?: string,
        city?: string,
        country?: string;
    };

    // onSave: (data: any) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({open, onClose, user}) =>  
{
    const [form, setForm] = React.useState({
        username: user.username || "",
        email:user.email,
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
    });

    if(!open) 
        return null;

    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const token = localStorage.getItem("access_token");
        if(!token){
            alert("You are not logged in.")
            // navigate("/User-login", { replace: true, state: { role } });
            return;
        }

        try{
            const response = await fetch(`${API_URL}/users/me/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,    
                },
                body: JSON.stringify(form),
                }
            )

            if (!response.ok){
                setErrorMsg(serverErrorMsg);
                throw new Error(await response.text());
            }

            alert("Profile updated successfully!");
            onClose(); //close dialog after saving
        }
        catch(error){
            console.error("User profile update error", error);
            alert("Network error — could not connect to server.");
        }
    }

    return(
        <div className="overlay" onClick={onClose}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Profile</h2>
                {errorMsg && <p className="errorMsg"> {errorMsg} </p>}
        
                <form onSubmit={handleSubmit} className="edit-form">
                    <label>
                        Username
                        <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        />
                    </label>

                    <label>
                        Email
                        <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
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
                        <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        />
                    </label>

                    <label>
                        Country
                        <input
                        type="text"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        />
                    </label>


                    <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
                        <button type="button" onClick={onClose}>
                            Cancel</button>
                        <button type="submit">
                            Save</button>
                    </div>
                </form>   
            </div>
        </div>
    );
};

export default EditProfileDialog;