const API_URL = import.meta.env.VITE_API_URL;

export async function testbackend() {
    const response = await fetch(`${API_URL}/`);

    if (!response.ok) {
        throw new Error("Backend request failed");
    }

    return response.json();
}