
import { Subject } from './types';

export const SUBJECTS: Subject[] = [
  {
    id: 'phonics',
    title: 'Phonics Fun',
    color: 'bg-yellow-400',
    concepts: [
      { id: 'abc-lower', title: 'ABC Lowercase', icon: '🔤', description: 'Mastering small letters.', suggestedItems: ['a', 'b', 'c', 'apple', 'ball'] },
      { id: 'abc-upper', title: 'ABC Uppercase', icon: '🅰️', description: 'Mastering BIG letters.', suggestedItems: ['A', 'B', 'C', 'APPLE', 'BALL'] },
      { id: 'vowels', title: 'Vibrant Vowels', icon: '🗣️', description: 'The glue that holds words together.', suggestedItems: ['A', 'E', 'I', 'O', 'U'] },
    ]
  },
  {
    id: 'math',
    title: 'Magic Math',
    color: 'bg-blue-400',
    concepts: [
      { id: 'addition', title: 'Add It Up!', icon: '➕', description: 'Combining things together.', suggestedItems: ['1', '2', '3', '+', '='] },
      { id: 'subtraction', title: 'Take Away', icon: '➖', description: 'Removing things from a group.', suggestedItems: ['5', '2', '3', '-', '='] },
      { id: 'counting', title: 'Counting 1-20', icon: '🔢', description: 'Learning our numbers.', suggestedItems: ['1', '2', '3', '4', '5'] },
    ]
  },
  {
    id: 'science',
    title: 'Super Science',
    color: 'bg-green-400',
    concepts: [
      { id: 'life-science', title: 'Life Sciences', icon: '🌿', description: 'Plants, animals, and us!', suggestedItems: ['Seed', 'Water', 'Sun', 'Flower'] },
      { id: 'physical-science', title: 'Forces & Motion', icon: '🧲', description: 'How things move and work.', suggestedItems: ['Push', 'Pull', 'Magnet', 'Spring'] },
      { id: 'earth-science', title: 'Planet Earth', icon: '🪐', description: 'Rocks, space, and weather.', suggestedItems: ['Sun', 'Cloud', 'Rain', 'Earth'] },
    ]
  }
];

export const WALL_COLORS = ['#FEF3C7', '#DBEAFE', '#D1FAE5', '#F3E8FF', '#FFEDD5', '#FFFFFF', '#FFD1DC', '#E0FFFE', '#F1F5F9', '#ECFDF5'];
export const FLOOR_COLORS = ['#D97706', '#2563EB', '#059669', '#7C3AED', '#EA580C', '#4B5563', '#92400E', '#1E293B'];

export const MASCOTS = [
  { id: 'none', label: 'No Pet', emoji: '🚫' },
  { id: 'cat', label: 'Whiskers', emoji: '🐱' },
  { id: 'dog', label: 'Buddy', emoji: '🐶' },
  { id: 'owl', label: 'Sage', emoji: '🦉' },
  { id: 'robot', label: 'Beep', emoji: '🤖' },
  { id: 'unicorn', label: 'Sparkle', emoji: '🦄' },
  { id: 'dino', label: 'Rex', emoji: '🦖' },
  { id: 'bunny', label: 'Hops', emoji: '🐰' },
  { id: 'dragon', label: 'Puff', emoji: '🐲' },
  { id: 'monkey', label: 'Nana', emoji: '🐒' },
];

export const SHELF_OBJECTS = ['📚', '🪴', '🌍', '🏆', '🔬', '🎨', '🧸', '🔭', '🧪', '🦴', '🍎', '💎'];

export const STICKERS = [
  { id: 'star', emoji: '⭐', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
  { id: 'rocket', emoji: '🚀', url: 'https://cdn-icons-png.flaticon.com/512/1356/1356479.png' },
  { id: 'rainbow', emoji: '🌈', url: 'https://cdn-icons-png.flaticon.com/512/2913/2913550.png' },
  { id: 'dino', emoji: '🦕', url: 'https://cdn-icons-png.flaticon.com/512/2405/2405335.png' },
  { id: 'flower', emoji: '🌸', url: 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png' },
  { id: 'sun', emoji: '☀️', url: 'https://cdn-icons-png.flaticon.com/512/869/869869.png' },
  { id: 'robot', emoji: '🤖', url: 'https://cdn-icons-png.flaticon.com/512/1694/1694364.png' },
  { id: 'cat', emoji: '🐱', url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
  { id: 'dog', emoji: '🐶', url: 'https://cdn-icons-png.flaticon.com/512/194/194279.png' },
  { id: 'alien', emoji: '👽', url: 'https://cdn-icons-png.flaticon.com/512/1904/1904425.png' },
  { id: 'balloon', emoji: '🎈', url: 'https://cdn-icons-png.flaticon.com/512/1046/1046808.png' },
  { id: 'pizza', emoji: '🍕', url: 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png' },
  { id: 'icecream', emoji: '🍦', url: 'https://cdn-icons-png.flaticon.com/512/938/938063.png' },
  { id: 'whale', emoji: '🐋', url: 'https://cdn-icons-png.flaticon.com/512/2043/2043132.png' },
  { id: 'butterfly', emoji: '🦋', url: 'https://cdn-icons-png.flaticon.com/512/187/187146.png' },
  { id: 'bee', emoji: '🐝', url: 'https://cdn-icons-png.flaticon.com/512/616/616466.png' },
  { id: 'frog', emoji: '🐸', url: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
  { id: 'heart', emoji: '❤️', url: 'https://cdn-icons-png.flaticon.com/512/833/833472.png' },
  { id: 'music', emoji: '🎵', url: 'https://cdn-icons-png.flaticon.com/512/1897/1897459.png' },
  { id: 'cloud', emoji: '☁️', url: 'https://cdn-icons-png.flaticon.com/512/252/252035.png' },
];

export interface MusicOption {
  id: string;
  label: string;
  icon: string;
  preview: string;
  artist?: string;
  lyrics?: string[];
}

export const MUSIC_OPTIONS: MusicOption[] = [
  { id: 'none', label: 'Quiet', icon: '🔇', preview: '' },
  { id: 'happy', label: 'Happy Jams', icon: '🎵', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', artist: 'Sunny Side', lyrics: ['Oh what a happy day!', 'We are learning and we play!', 'Sunshine in our hearts today!'] },
  { id: 'lullaby', label: 'Calm Piano', icon: '🎹', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', artist: 'Soft Keys', lyrics: ['Peaceful and calm...', 'Rest your mind now.', 'Dreams are floating by.'] },
  { id: 'nature', label: 'Birdies', icon: '🐦', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', artist: 'Mother Nature', lyrics: ['Tweet tweet in the trees.', 'Listen to the gentle breeze.'] },
  { id: 'bounce', label: 'Fun Bounce', icon: '🦘', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', artist: 'Boing Boing', lyrics: ['Jump up high!', 'Touch the sky!', 'Bounce around!'] },
  { id: 'ukulele', label: 'Island Fun', icon: '🏝️', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', artist: 'Aloha Waves', lyrics: ['Sway with the palms.', 'Ocean is so calm.', 'Island vibes are here.'] },
];
