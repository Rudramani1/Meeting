import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

function Home() {
    return (
        <div className="min-h-screen bg-black text-white">

            <Navbar />

            <main>
                <Hero />
            </main>

            <Footer />

        </div>
    );
}

export default Home;