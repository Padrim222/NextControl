/**
 * Next Control Icon System — Heroicons Outline
 * Lucide-compatible API: size, strokeWidth (ignored), className, style
 * All icons sourced from heroicons.com/outline
 */
import React from 'react';
import {
  AcademicCapIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownRightIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BarsArrowUpIcon,
  BellIcon,
  BoltIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CameraIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftIcon,
  ChatBubbleOvalLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  GlobeAltIcon,
  StarIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  FlagIcon,
  InboxIcon,
  InformationCircleIcon,
  LinkIcon,
  LightBulbIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  MicrophoneIcon,
  MinusIcon,
  PaperAirplaneIcon,
  PercentBadgeIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  StopCircleIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  ViewfinderCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type IconProps = {
  size?: number;
  strokeWidth?: number; // kept for API compat, heroicons handles this internally
  className?: string;
  style?: React.CSSProperties;
};

function sizeClass(size: number): string {
  const map: Record<number, string> = {
    12: 'w-3 h-3',
    13: 'w-[13px] h-[13px]',
    14: 'w-3.5 h-3.5',
    15: 'w-[15px] h-[15px]',
    16: 'w-4 h-4',
    17: 'w-[17px] h-[17px]',
    18: 'w-[18px] h-[18px]',
    20: 'w-5 h-5',
    22: 'w-[22px] h-[22px]',
    24: 'w-6 h-6',
    28: 'w-7 h-7',
    32: 'w-8 h-8',
  };
  return map[size] ?? `w-[${size}px] h-[${size}px]`;
}

function wrap(
  HeroIcon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
) {
  return function Icon({ size = 20, className = '', style, strokeWidth: _sw }: IconProps) {
    const cls = [sizeClass(size), className].filter(Boolean).join(' ');
    return <HeroIcon className={cls} style={style} />;
  };
}

// ── Navigation ───────────────────────────────────────────────
export const LayoutDashboard   = wrap(Squares2X2Icon);
export const ArrowLeft         = wrap(ArrowLeftIcon);
export const ArrowRight        = wrap(ArrowRightIcon);
export const ArrowUpRight      = wrap(ArrowUpRightIcon);
export const ArrowDownRight    = wrap(ArrowDownRightIcon);
export const ChevronRight      = wrap(ChevronRightIcon);

// ── Actions ──────────────────────────────────────────────────
export const LogOut            = wrap(ArrowRightOnRectangleIcon);
export const Menu              = wrap(Bars3Icon);
export const Download          = wrap(ArrowDownTrayIcon);
export const Upload            = wrap(ArrowUpTrayIcon);
export const Send              = wrap(PaperAirplaneIcon);
export const Search            = wrap(MagnifyingGlassIcon);
export const RefreshCw         = wrap(ArrowPathIcon);
export const X                 = wrap(XMarkIcon);
export const XIcon             = wrap(XMarkIcon); // alias
export const Plus              = wrap(PlusIcon);
export const Minus             = wrap(MinusIcon);
export const Eye               = wrap(EyeIcon);
export const EyeOff            = wrap(EyeSlashIcon);
export const Camera            = wrap(CameraIcon);
export const Pencil            = wrap(PencilIcon);
export const Trash2            = wrap(TrashIcon);

// ── Communication ────────────────────────────────────────────
export const MessageSquare     = wrap(ChatBubbleLeftEllipsisIcon);
export const MessageCircle     = wrap(ChatBubbleOvalLeftIcon);
export const Phone             = wrap(PhoneIcon);
export const Bell              = wrap(BellIcon);
export const Mail              = wrap(EnvelopeIcon);
export const Megaphone         = wrap(MegaphoneIcon);
export const Mic               = wrap(MicrophoneIcon);
export const HeadphonesIcon    = wrap(Cog6ToothIcon); // closest available

// ── Data / Charts ─────────────────────────────────────────────
export const BarChart3         = wrap(ChartBarIcon);
export const TrendingUp        = wrap(ArrowTrendingUpIcon);
export const TrendingDown      = wrap(ArrowTrendingDownIcon);
export const Target            = wrap(ViewfinderCircleIcon);
export const Crosshair         = wrap(ViewfinderCircleIcon);
export const Percent           = wrap(PercentBadgeIcon);
export const Database          = wrap(CircleStackIcon);

// ── Time ─────────────────────────────────────────────────────
export const Calendar          = wrap(CalendarDaysIcon);
export const CalendarDays      = wrap(CalendarDaysIcon);
export const Clock             = wrap(ClockIcon);

// ── Status ───────────────────────────────────────────────────
export const CheckCircle       = wrap(CheckCircleIcon);
export const CheckCircle2      = wrap(CheckCircleIcon);
export const AlertTriangle     = wrap(ExclamationTriangleIcon);
export const AlertCircle       = wrap(ExclamationCircleIcon);
export const XCircle           = wrap(XCircleIcon);
export const HelpCircle        = wrap(QuestionMarkCircleIcon);
export const Award             = wrap(TrophyIcon);
export const StopCircle        = wrap(StopCircleIcon);
export const Square            = wrap(StopCircleIcon);

// ── People ───────────────────────────────────────────────────
export const Users             = wrap(UsersIcon);
export const User              = wrap(UserIcon);
export const Shield            = wrap(ShieldCheckIcon);

// ── Content ──────────────────────────────────────────────────
export const FileText          = wrap(DocumentTextIcon);
export const GraduationCap     = wrap(AcademicCapIcon);
export const BookOpen          = wrap(BookOpenIcon);
export const Brain             = wrap(LightBulbIcon);
export const ClipboardList     = wrap(ClipboardDocumentListIcon);
export const Lightbulb         = wrap(LightBulbIcon);

// ── Other ────────────────────────────────────────────────────
export const Zap               = wrap(BoltIcon);
export const Sparkles          = wrap(SparklesIcon);
export const Settings          = wrap(Cog6ToothIcon);
export const Loader2           = wrap(ArrowPathIcon); // use with animate-spin
export const Bot               = wrap(CpuChipIcon);
export const Lock              = wrap(LockClosedIcon);
export const Briefcase         = wrap(BriefcaseIcon);
export const Play              = wrap(PlayIcon);
export const Flag              = wrap(FlagIcon);
export const BarsArrowUp       = wrap(BarsArrowUpIcon);

// ── Re-exports for completeness ──────────────────────────────
export const ArrowTopRightOnSquare = wrap(ArrowTopRightOnSquareIcon);
export const Cog6Tooth         = wrap(Cog6ToothIcon);
export const Inbox             = wrap(InboxIcon);
export const Info              = wrap(InformationCircleIcon);
export const Link              = wrap(LinkIcon);
export const Link2             = wrap(LinkIcon);
export const ExternalLink      = wrap(ArrowTopRightOnSquareIcon);
export const Building2         = wrap(BuildingOffice2Icon);
export const UserPlus          = wrap(UsersIcon);
export const Copy              = wrap(ClipboardDocumentListIcon);
export const ClipboardCopy     = wrap(ClipboardDocumentListIcon);
export const ClipboardCheck    = wrap(ClipboardDocumentCheckIcon);
export const CheckSquare       = wrap(ClipboardDocumentCheckIcon);
export const Circle            = wrap(CheckCircleIcon);
export const Compass           = wrap(GlobeAltIcon);
export const Star              = wrap(StarIcon);
export const Headphones        = wrap(Cog6ToothIcon); // closest available
export type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }>;
