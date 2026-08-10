import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Store, Play } from 'lucide-react';
import FastImage from './FastImage';

interface StoryCardProps {
    image: string;
    title: string;
    ctaLink: string;
    brandLogo?: string;
    isVideo?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({
    image,
    title,
    ctaLink,
    brandLogo,
    isVideo = false
}) => {
    const router = useRouter();

    return (
        <div
            className="relative w-[280px] h-[480px] rounded-2xl overflow-hidden cursor-pointer group flex-shrink-0"
            onClick={() => router.push(ctaLink)}
        >
            <div className="absolute inset-0 bg-gray-200">
                <FastImage
                    src={image}
                    alt={title}
                    width={280}
                    height={480}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
            </div>

            {/* Brand Info Top */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <div className="w-8 h-8 rounded-full border-2 border-white/50 overflow-hidden bg-white/20 backdrop-blur-md">
                    {brandLogo ? (
                        <Image
                            src={brandLogo}
                            alt="Brand"
                            fill
                            className="object-cover"
                            sizes="32px"
                        />
                    ) : (
                        <Store className="w-4 h-4 text-white m-1.5" />
                    )}
                </div>
                <span className="text-white text-xs font-bold drop-shadow-md">ShowMyFit</span>
            </div>

            {/* Play Button if video */}
            {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                </div>
            )}

            <div className="absolute bottom-0 left-0 w-full p-6 text-white transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                <h3 className="text-2xl font-black mb-2 leading-none drop-shadow-lg">{title}</h3>

                <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <button className="flex-1 bg-white text-black py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors">
                        View Collection
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Heart className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryCard;
