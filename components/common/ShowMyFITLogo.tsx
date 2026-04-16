import Image from 'next/image';

interface ShowMyFITLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ShowMyFITLogo: React.FC<ShowMyFITLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-24',     // Added widths for better Image component behavior
    md: 'h-10 w-32',
    lg: 'h-12 w-40'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className} flex items-center justify-center shrink-0`}>
      <Image
        src="/assets/showmyfit-logo.png"
        alt="ShowMyFIT"
        width={160}
        height={48}
        priority
        className="object-contain max-w-full max-h-full"
      />
      {/* Fallback text logo */}
      <div
        className={`${textSizeClasses[size]} font-bold text-white hidden ${className}`}
        style={{ display: 'none' }}
      >
        ShowMyFIT
      </div>
    </div>
  );
};

export default ShowMyFITLogo;
