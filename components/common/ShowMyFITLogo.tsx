import Image from 'next/image';

interface ShowMyFITLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Invert white logo for light backgrounds (navbar, etc.) */
  invert?: boolean;
}

const sizeConfig = {
  sm: {
    box: 'h-8 w-28',
    scale: 'scale-[2.8]',
  },
  md: {
    box: 'h-10 w-36 md:h-11 md:w-40',
    scale: 'scale-[3]',
  },
  lg: {
    box: 'h-12 w-44 md:h-14 md:w-52',
    scale: 'scale-[3.2]',
  },
};

const ShowMyFITLogo: React.FC<ShowMyFITLogoProps> = ({
  size = 'md',
  className = '',
  invert = true,
}) => {
  const { box, scale } = sizeConfig[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center ${box}`}
      aria-label="ShowMyFIT"
    >
      <Image
        src="/assets/showmyfit-logo.png"
        alt="ShowMyFIT"
        width={500}
        height={500}
        priority
        className={`h-full w-full object-contain origin-center ${scale} ${invert ? 'invert' : ''} ${className}`}
      />
    </div>
  );
};

export default ShowMyFITLogo;
