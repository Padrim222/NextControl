import React from 'react';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

type BaseIconProps = {
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
};

// This wrapper allows us to use Lucide API (.size, .className, snake_case or whatever)
// while rendering HeroIcons in the background
const createIcon = (HeroIcon: React.ElementType) => {
  return function Icon({ size = 20, className = '', color, style, ...props }: BaseIconProps) {
    return (
      <HeroIcon 
        width={size} 
        height={size} 
        className={className} 
        style={{ color, ...style }} 
        {...props} 
      />
    );
  };
};

// Common icons mapping (Lucide names -> HeroIcons)
export const LayoutDashboard = createIcon(HeroIcons.Squares2X2Icon);
export const Briefcase = createIcon(HeroIcons.BriefcaseIcon);
export const Users = createIcon(HeroIcons.UsersIcon);
export const UserCircle = createIcon(HeroIcons.UserCircleIcon);
export const Library = createIcon(HeroIcons.BookOpenIcon);
export const MessagesSquare = createIcon(HeroIcons.ChatBubbleLeftRightIcon);
export const Settings = createIcon(HeroIcons.Cog6ToothIcon);
export const HelpCircle = createIcon(HeroIcons.QuestionMarkCircleIcon);
export const LogOut = createIcon(HeroIcons.ArrowRightOnRectangleIcon);
export const FileText = createIcon(HeroIcons.DocumentTextIcon);
export const TrendingUp = createIcon(HeroIcons.ArrowTrendingUpIcon);
export const DollarSign = createIcon(HeroIcons.CurrencyDollarIcon);
export const Target = createIcon(HeroIcons.BoltIcon);
export const Flame = createIcon(HeroIcons.FireIcon);
export const Brain = createIcon(HeroIcons.LightBulbIcon);
export const Activity = createIcon(HeroIcons.ChartBarIcon);
export const Award = createIcon(HeroIcons.SparklesIcon);
export const Bot = createIcon(HeroIcons.CpuChipIcon);
export const BookOpen = createIcon(HeroIcons.BookOpenIcon);
export const Bookmark = createIcon(HeroIcons.BookmarkIcon);
export const Calendar = createIcon(HeroIcons.CalendarIcon);
export const CheckCircle = createIcon(HeroIcons.CheckCircleIcon);
export const CheckCircle2 = createIcon(HeroIcons.CheckCircleIcon);
export const Check = createIcon(HeroIcons.CheckIcon);
export const ChevronRight = createIcon(HeroIcons.ChevronRightIcon);
export const ChevronLeft = createIcon(HeroIcons.ChevronLeftIcon);
export const ChevronDown = createIcon(HeroIcons.ChevronDownIcon);
export const Circle = createIcon(HeroIcons.CheckCircleIcon);
export const Clock = createIcon(HeroIcons.ClockIcon);
export const CreditCard = createIcon(HeroIcons.CreditCardIcon);
export const Edit = createIcon(HeroIcons.PencilIcon);
export const Eye = createIcon(HeroIcons.EyeIcon);
export const Heart = createIcon(HeroIcons.HeartIcon);
export const Image = createIcon(HeroIcons.PhotoIcon);
export const Info = createIcon(HeroIcons.InformationCircleIcon);
export const Lock = createIcon(HeroIcons.LockClosedIcon);
export const Mail = createIcon(HeroIcons.EnvelopeIcon);
export const MessageSquare = createIcon(HeroIcons.ChatBubbleLeftIcon);
export const Phone = createIcon(HeroIcons.PhoneIcon);
export const PieChart = createIcon(HeroIcons.ChartPieIcon);
export const Plus = createIcon(HeroIcons.PlusIcon);
export const PlusCircle = createIcon(HeroIcons.PlusCircleIcon);
export const Search = createIcon(HeroIcons.MagnifyingGlassIcon);
export const Send = createIcon(HeroIcons.PaperAirplaneIcon);
export const SendIcon = createIcon(HeroIcons.PaperAirplaneIcon);
export const Shield = createIcon(HeroIcons.ShieldCheckIcon);
export const Star = createIcon(HeroIcons.StarIcon);
export const Trash = createIcon(HeroIcons.TrashIcon);
export const Trash2 = createIcon(HeroIcons.TrashIcon);
export const User = createIcon(HeroIcons.UserIcon);
export const Video = createIcon(HeroIcons.VideoCameraIcon);
export const X = createIcon(HeroIcons.XMarkIcon);
export const Zap = createIcon(HeroIcons.BoltIcon);
export const AlertCircle = createIcon(HeroIcons.ExclamationCircleIcon);
export const ArrowRight = createIcon(HeroIcons.ArrowRightIcon);
export const ArrowUpRight = createIcon(HeroIcons.ArrowUpRightIcon);
export const BarChart2 = createIcon(HeroIcons.ChartBarIcon);
export const PlayCircle = createIcon(HeroIcons.PlayCircleIcon);
export const Mic = createIcon(HeroIcons.MicrophoneIcon);
export const Share2 = createIcon(HeroIcons.ShareIcon);
export const Loader2 = createIcon(HeroIcons.ArrowPathIcon);
export const EyeOff = createIcon(HeroIcons.EyeSlashIcon);
export const Copy = createIcon(HeroIcons.DocumentDuplicateIcon);

export const GraduationCap = createIcon(HeroIcons.AcademicCapIcon);
export const Sparkles = createIcon(HeroIcons.SparklesIcon);

export const Rocket = createIcon(HeroIcons.RocketLaunchIcon);
export const ShieldCheck = createIcon(HeroIconsSolid.ShieldCheckIcon);
export const StarSolid = createIcon(HeroIconsSolid.StarIcon);
export const Crown = createIcon(HeroIconsSolid.TrophyIcon);

export const Lightbulb = createIcon(HeroIcons.LightBulbIcon);
export const ClipboardCopy = createIcon(HeroIcons.ClipboardDocumentIcon);
export const AlertTriangle = createIcon(HeroIcons.ExclamationTriangleIcon);
export const ExternalLink = createIcon(HeroIcons.ArrowTopRightOnSquareIcon);
export const ArrowDownRight = createIcon(HeroIcons.ArrowDownRightIcon);
export const ArrowLeft = createIcon(HeroIcons.ArrowLeftIcon);
export const BarChart3 = createIcon(HeroIcons.ChartBarIcon);
export const Camera = createIcon(HeroIcons.CameraIcon);
export const ClipboardCheck = createIcon(HeroIcons.ClipboardDocumentCheckIcon);
export const Database = createIcon(HeroIcons.CircleStackIcon);
export const Inbox = createIcon(HeroIcons.InboxIcon);
export const Link2 = createIcon(HeroIcons.LinkIcon);
export const Menu = createIcon(HeroIcons.Bars3Icon);
export const Moon = createIcon(HeroIcons.MoonIcon);
export const Square = createIcon(HeroIcons.StopIcon);
export const Sun = createIcon(HeroIcons.SunIcon);
export const RefreshCw = createIcon(HeroIcons.ArrowPathIcon);
