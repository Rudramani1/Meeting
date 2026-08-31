const API_URL = import.meta.env.VITE_API_URL;

export async function createMeeting(name) {

    const response = await fetch(
        `${API_URL}/create`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name
            })
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create meeting");
    }

    return response.json();
}