'use client';

import type { LucideProps } from 'lucide-react';
import {
  Atom, Beaker, Microscope, Dna, Brain, Heart, Thermometer, Zap, Flame, Droplet,
  Wind, Sun, Moon, Star, Cloud,
  Calculator, BarChart3, PieChart, TrendingUp, TrendingDown, Percent, Hash,
  Clock, Landmark, BookOpen, Globe2, Map, Compass, ScrollText, Crown,
  Cpu, Code2, Server, Wifi, Smartphone, Monitor, Database, TerminalSquare,
  Shield, ShieldCheck, Lock, Key, Eye, Search, Target,
  Award, Trophy, Medal, Flag,
  Users, User, GraduationCap,
  Lightbulb, ArrowRight, ArrowUp, Check, X, Plus, Minus, RefreshCw, Repeat,
  Circle, Diamond, Triangle, Square, Hexagon,
  Layers, Grid3X3, List, Puzzle, Settings, Wrench,
  Music, Image, Film, Camera, Mic, Volume2,
  Car, Plane, Rocket, Ship,
  TreePine, Leaf, Flower2, Mountain,
  Building2, Home, Factory,
  DollarSign, Coins, Wallet, CreditCard,
  Stethoscope, Pill, Syringe, Activity, HeartPulse,
  Scale, Gavel,
  MessageCircle, Mail, Phone, Send,
  FileText, Folder, ClipboardList,
  Apple, Coffee,
  Sparkles, CircleDot, Boxes, Network, GitBranch, Orbit,
  AlertTriangle, Info, HelpCircle, BookMarked, PenTool, Palette,
  Waypoints, Route, CircuitBoard, Binary, Cog,
  Sigma, Infinity, Anchor, Link2, Tag, Radio, Newspaper,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  /* Science */
  atom: Atom, beaker: Beaker, flask: Beaker, microscope: Microscope, dna: Dna,
  brain: Brain, heart: Heart, thermometer: Thermometer, zap: Zap, lightning: Zap,
  flame: Flame, fire: Flame, droplet: Droplet, water: Droplet,
  wind: Wind, sun: Sun, moon: Moon, star: Star, cloud: Cloud,
  /* Math & Data */
  calculator: Calculator, 'bar-chart': BarChart3, chart: BarChart3, 'pie-chart': PieChart,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, percent: Percent, hash: Hash,
  sigma: Sigma, infinity: Infinity,
  /* History & Social */
  clock: Clock, time: Clock, landmark: Landmark, book: BookOpen, 'book-open': BookOpen,
  globe: Globe2, world: Globe2, earth: Globe2, map: Map, compass: Compass,
  scroll: ScrollText, crown: Crown, newspaper: Newspaper,
  /* Technology */
  cpu: Cpu, chip: Cpu, code: Code2, server: Server, wifi: Wifi,
  smartphone: Smartphone, phone: Phone, monitor: Monitor, screen: Monitor,
  database: Database, terminal: TerminalSquare, circuit: CircuitBoard, binary: Binary,
  /* Security */
  shield: Shield, 'shield-check': ShieldCheck, lock: Lock, key: Key,
  eye: Eye, search: Search, target: Target,
  /* Achievement */
  award: Award, trophy: Trophy, medal: Medal, flag: Flag,
  /* People */
  users: Users, people: Users, user: User, person: User,
  'graduation-cap': GraduationCap, graduation: GraduationCap,
  /* Conceptual */
  lightbulb: Lightbulb, idea: Lightbulb, 'arrow-right': ArrowRight, 'arrow-up': ArrowUp,
  check: Check, x: X, cross: X, plus: Plus, minus: Minus,
  refresh: RefreshCw, cycle: Repeat, repeat: Repeat,
  /* Shapes */
  circle: Circle, diamond: Diamond, triangle: Triangle, square: Square, hexagon: Hexagon,
  /* Structure */
  layers: Layers, grid: Grid3X3, list: List, puzzle: Puzzle,
  settings: Settings, wrench: Wrench, tool: Wrench, cog: Cog, gear: Cog,
  /* Media */
  music: Music, image: Image, photo: Image, film: Film, video: Film,
  camera: Camera, mic: Mic, microphone: Mic, volume: Volume2, speaker: Volume2, radio: Radio,
  /* Transport */
  car: Car, vehicle: Car, plane: Plane, aircraft: Plane, rocket: Rocket, ship: Ship,
  /* Nature */
  tree: TreePine, leaf: Leaf, plant: Leaf, flower: Flower2, mountain: Mountain,
  /* Building */
  building: Building2, home: Home, house: Home, factory: Factory,
  /* Finance */
  dollar: DollarSign, money: DollarSign, coins: Coins, wallet: Wallet,
  'credit-card': CreditCard, finance: DollarSign,
  /* Medical */
  stethoscope: Stethoscope, pill: Pill, medicine: Pill, syringe: Syringe,
  activity: Activity, pulse: HeartPulse, 'heart-pulse': HeartPulse,
  /* Legal */
  scale: Scale, balance: Scale, gavel: Gavel, law: Gavel, justice: Scale,
  /* Communication */
  message: MessageCircle, chat: MessageCircle, mail: Mail, email: Mail, send: Send,
  /* Documents */
  file: FileText, document: FileText, folder: Folder, clipboard: ClipboardList,
  /* Food */
  apple: Apple, food: Apple, coffee: Coffee,
  /* Misc */
  sparkles: Sparkles, magic: Sparkles, dot: CircleDot, boxes: Boxes,
  network: Network, branch: GitBranch, orbit: Orbit,
  warning: AlertTriangle, alert: AlertTriangle, info: Info, help: HelpCircle,
  bookmark: BookMarked, pen: PenTool, paint: Palette, palette: Palette,
  waypoints: Waypoints, route: Route, anchor: Anchor, link: Link2, tag: Tag,
};

function isEmoji(str: string): boolean {
  return str.length <= 3 && /[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27BF}|\u{FE00}-\u{FEFF}|\u{1F900}-\u{1F9FF}|\u{200D}|\u{20E3}|\u{E0020}-\u{E007F}]/u.test(str);
}

interface SlideIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export default function SlideIcon({ name, className = '', size = 20, color }: SlideIconProps) {
  if (!name) return <CircleDot className={className} size={size} color={color} strokeWidth={1.75} />;

  // If it's an emoji, show a generic fallback
  if (isEmoji(name)) {
    return <CircleDot className={className} size={size} color={color} strokeWidth={1.75} />;
  }

  const key = name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  const Icon = iconMap[key];

  if (Icon) {
    return <Icon className={className} size={size} color={color} strokeWidth={1.75} />;
  }

  // Try partial match
  const partial = Object.keys(iconMap).find(k => k.includes(key) || key.includes(k));
  if (partial) {
    const PartialIcon = iconMap[partial];
    return <PartialIcon className={className} size={size} color={color} strokeWidth={1.75} />;
  }

  // Fallback: generic dot icon
  return <CircleDot className={className} size={size} color={color} strokeWidth={1.75} />;
}
