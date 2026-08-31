import { useNavigate } from 'react-router-dom'
function Hero() {
    const navigate = useNavigate()
    return (
        <section className="px-6 pt-6">

            <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center rounded-3xl bg-gray-900">

                <div className="max-w-4xl px-6 text-center">

                    <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                        Meetings, but smarter.
                    </h1>

                    <p className="mx-auto mt-8 max-w-2xl text-lg text-gray-400 sm:text-xl">
                        AI-powered video meetings that help your team
                        communicate, collaborate, and get more done.
                    </p>

                    <div className="mt-10 flex items-center justify-center gap-6">

                        <button  onClick={() => navigate("/join")} 
                        className="rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400">
                            Join Meeting
                        </button>

                        <button  onClick={() => navigate("/create")} 
                        className="font-semibold text-white hover:text-gray-300">
                            Create Meeting
                        </button>

                    </div>

                </div>

            </div>

        </section>
    );
}

export default Hero;