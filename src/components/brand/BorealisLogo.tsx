import Image from 'next/image';

export function BorealisLogo({ className = '', priority = false, variant = 'dark' }: { className?: string; priority?: boolean; variant?: 'light' | 'dark' }) {
  return <Image
    src={`/brand/borealis-logo-${variant}.svg`}
    alt="Borealis Guesthouse"
    width={730}
    height={490}
    priority={priority}
    className={className}
  />;
}
