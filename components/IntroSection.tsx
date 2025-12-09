import { useRouter } from "next/navigation";
import SplitText from "./SplitText";
import { Button } from "./ui/button";

interface IntroSectionProps {
    darkMode: boolean;
}

const handleAnimationComplete = () => {
    console.log('Animation complete');
};

const isMobile = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    return width < 768;
};

export default function IntroSection({ darkMode }: IntroSectionProps) {
    const router = useRouter();
    return (
        <section className="w-full ">
            <div className="grid md:grid-cols-2 grid-cols-1 md:gap-1 gap-2 items-center justify-center h-full mx-auto max-w-screen md:px-28 px-6">
                {!isMobile() && (
                    <div className="flex justify-center">
                        <img src='/graduate-3.webp' alt="Graduate" className="md:h-[800px] h-[400px] w-auto" />
                    </div>
                )}

                <div className="text-center text-left mb-8 mt-12">
                    <SplitText
                        text="Welcome to the big leagues"
                        className="text-5xl lg:text-6xl font-bold text-primary"
                        delay={90}
                        duration={0.7}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 40 }}
                        to={{ opacity: 1, y: 0 }}
                        threshold={0.4}
                        rootMargin="-100px"
                        textAlign="left"
                        onLetterAnimationComplete={handleAnimationComplete}
                    />
                    <div className="mt-6">
                        <p className="md:text-4xl text-2xl text-primary leading-relaxed">
                            You just landed in Kenya's official student network and knowledge base. <br /><br /> Explore Kenya's universities and courses, compare institutions, and make informed decisions about your education and it's future.
                        </p>
                    </div>
                    <div className="mt-6 flex flex-col lg:flex-row gap-4">
                        <Button
                            variant="default"
                            size="lg"
                            className="w-full lg:w-auto cursor-pointer text-white"
                            onClick={() => router.push('/institutions')}
                        >
                            Help me decide
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full lg:w-auto cursor-pointer"
                            onClick={() => router.push('/me')}
                        >
                            I know what I'm doing →
                        </Button>
                    </div>
                </div>

            </div>
        </section>
    );
}