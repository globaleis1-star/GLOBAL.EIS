
import React from 'react';
import { 
  Calculator, 
  FileText, 
  AlertTriangle, 
  Info, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Plane,
  Coins,
  ClipboardList,
  AlertCircle,
  Landmark,
  RefreshCw,
  Sparkles,
  ArrowLeftRight,
  Smartphone,
  Globe,
  Briefcase,
  GraduationCap,
  HeartPulse
} from 'lucide-react';

export type IconType = 
  | 'fees' 
  | 'docs' 
  | 'alert' 
  | 'info' 
  | 'timeline' 
  | 'status' 
  | 'links' 
  | 'travel' 
  | 'currency' 
  | 'checklist' 
  | 'warning' 
  | 'bank' 
  | 'refresh' 
  | 'sparkle' 
  | 'smartphone'
  | 'globe'
  | 'business'
  | 'study'
  | 'medical'
  | 'swap';

interface IconManagerProps {
  type: IconType | string;
  className?: string;
}

const IconManager: React.FC<IconManagerProps> = ({ type, className = "w-6 h-6" }) => {
  switch (type) {
    case 'fees': return <Calculator className={className} />;
    case 'docs': return <FileText className={className} />;
    case 'alert': return <AlertTriangle className={className} />;
    case 'info': return <Info className={className} />;
    case 'timeline': return <Clock className={className} />;
    case 'status': return <ShieldCheck className={className} />;
    case 'links': return <ExternalLink className={className} />;
    case 'travel': return <Plane className={className} />;
    case 'currency': return <Coins className={className} />;
    case 'checklist': return <ClipboardList className={className} />;
    case 'warning': return <AlertCircle className={className} />;
    case 'bank': return <Landmark className={className} />;
    case 'refresh': return <RefreshCw className={className} />;
    case 'sparkle': return <Sparkles className={className} />;
    case 'swap': return <ArrowLeftRight className={className} />;
    case 'smartphone': return <Smartphone className={className} />;
    case 'globe': return <Globe className={className} />;
    case 'business': return <Briefcase className={className} />;
    case 'study': return <GraduationCap className={className} />;
    case 'medical': return <HeartPulse className={className} />;
    default: return <Info className={className} />;
  }
};

export default IconManager;
