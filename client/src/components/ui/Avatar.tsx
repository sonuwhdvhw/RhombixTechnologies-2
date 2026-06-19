import { cn, getAvatarUrl, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  ring?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
  '2xl': 'w-24 h-24 text-xl',
};

export default function Avatar({ src, name, size = 'md', ring = false, className, onClick }: AvatarProps) {
  const url = getAvatarUrl(src, name || 'U');
  const initials = getInitials(name || 'U');

  return (
    <div
      className={cn(
        'relative rounded-full shrink-0',
        ring && 'story-ring',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {ring ? (
        <div className="story-ring-inner">
          <img
            src={url}
            alt={name || 'Avatar'}
            className={cn('rounded-full object-cover', sizeMap[size])}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=128&bold=true`;
            }}
          />
        </div>
      ) : (
        <img
          src={url}
          alt={name || 'Avatar'}
          className={cn('rounded-full object-cover', sizeMap[size])}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=128&bold=true`;
          }}
        />
      )}
    </div>
  );
}
