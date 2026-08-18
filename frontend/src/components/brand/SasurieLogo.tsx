import sasurieLogo from '../../assets/images/sasurie-logo.png';

type SasurieLogoProps = {
  className?: string;
  alt?: string;
};

/** Institutional Sasurie mark used in shell, auth, and documents. */
export function SasurieLogo({ className = 'h-9 w-9 object-contain', alt = 'Sasurie' }: SasurieLogoProps) {
  return <img src={sasurieLogo} alt={alt} className={className} />;
}
