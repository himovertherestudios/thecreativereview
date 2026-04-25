import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Upload,
  X,
  Shield,
  Check,
  ArrowRight,
  EyeOff,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ContentRating, HonestyLevel } from '../types';
import { supabase } from '../lib/supabase';

interface StarterImage {
  url: string | null;
  file: File | null;
  caption: string;
  rating: ContentRating | '';
  honesty: HonestyLevel | '';
  allowAnon: boolean;
  categories: string[];
}

const CONTENT_RATINGS: ContentRating[] = ['Safe', 'Suggestive', 'Explicit'];

const HONESTY_LEVELS: HonestyLevel[] = [
  'Be Gentle',
  'Be Honest',
  'Cook Me Respectfully',
];

const CRITIQUE_CATEGORIES = [
  'Lighting',
  'Composition',
  'Editing',
  'Pose',
  'Expression',
  'Makeup',
  'Wardrobe',
  'Concept',
  'Social Media Ready',
  'Portfolio Ready',
];

function getFileExtension(file: File) {
  const nameParts = file.name.split('.');
  return nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : 'jpg';
}

export default function StarterUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [starterImage, setStarterImage] = useState<StarterImage>({
    url: null,
    file: null,
    caption: '',
    rating: '',
    honesty: '',
    allowAnon: true,
    categories: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isNsfw = starterImage.rating === 'Explicit';

  const isComplete =
    Boolean(starterImage.url) &&
    Boolean(starterImage.file) &&
    Boolean(starterImage.rating) &&
    Boolean(starterImage.honesty) &&
    starterImage.categories.length > 0;

  const updateStarterImage = (updates: Partial<StarterImage>) => {
    setStarterImage((current) => ({
      ...current,
      ...updates,
    }));

    if (saveError) {
      setSaveError('');
    }
  };

  const toggleCategory = (category: string) => {
    setStarterImage((current) => {
      const alreadySelected = current.categories.includes(category);

      return {
        ...current,
        categories: alreadySelected
          ? current.categories.filter((item) => item !== category)
          : [...current.categories, category],
      };
    });

    if (saveError) {
      setSaveError('');
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setSaveError('Please upload an image file.');
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    updateStarterImage({
      file: selectedFile,
      url: previewUrl,
    });
  };

  const handleRemoveImage = () => {
    if (starterImage.url && starterImage.file) {
      URL.revokeObjectURL(starterImage.url);
    }

    updateStarterImage({
      url: null,
      file: null,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRatingStyles = (rating: ContentRating) => {
    const isSelected = starterImage.rating === rating;

    if (rating === 'Safe') {
      return isSelected
        ? 'border-green-500 bg-green-500/15 text-green-300'
        : 'border-green-500/20 text-green-500 hover:border-green-500/60';
    }

    if (rating === 'Suggestive') {
      return isSelected
        ? 'border-orange-500 bg-orange-500/15 text-orange-300'
        : 'border-orange-500/20 text-orange-500 hover:border-orange-500/60';
    }

    return isSelected
      ? 'border-red-500 bg-red-500/15 text-red-300'
      : 'border-red-500/20 text-red-500 hover:border-red-500/60';
  };

  const handleFinish = async () => {
    if (!isComplete || isSaving || !starterImage.file) return;

    setIsSaving(true);
    setSaveError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('No logged-in user found. Please sign up again.');
      }

      const fileExtension = getFileExtension(starterImage.file);
      const filePath = `${user.id}/starter-${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, starterImage.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: starterImage.file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const publicImageUrl = publicUrlData.publicUrl;

      const { error: photoError } = await supabase.from('photos').insert({
        user_id: user.id,
        image_url: publicImageUrl,
        storage_path: filePath,
        watermarked_url: publicImageUrl,
        watermarked_storage_path: null,
        caption: starterImage.caption.trim(),
        content_rating: starterImage.rating,
        honesty_level: starterImage.honesty,
        feedback_categories: starterImage.categories,
        allow_anonymous: starterImage.allowAnon,
        is_starter_upload: true,
        is_hidden: false,
      });

      if (photoError) {
        throw photoError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          has_completed_starter_upload: true,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      navigate('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while uploading your starter image.';

      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black px-4 py-6 md:p-12 pb-28 md:pb-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 md:mb-12">
          <p className="text-brand-accent text-xs font-black uppercase tracking-[0.25em] mb-3">
            First Review Image
          </p>

          <h1 className="text-3xl md:text-6xl font-black tracking-tighter mb-4">
            START WITH ONE
          </h1>

          <p className="text-gray-400 font-medium max-w-2xl text-sm md:text-base leading-relaxed">
            Upload your first piece of work so the community has something to
            review. No pressure. Just bring one frame worth talking about.
            <span className="text-brand-accent block mt-3 font-bold uppercase text-xs tracking-widest">
              • Uploaded to Supabase Storage • Protected preview watermark shown
              in prototype mode •
            </span>
          </p>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-8 mb-10">
          {/* Upload Preview */}
          <section>
            <div
              className={`relative aspect-[4/5] md:aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${starterImage.url
                  ? 'border-solid border-brand-accent'
                  : 'border-white/10 bg-brand-gray hover:bg-white/5 cursor-pointer'
                }`}
              onClick={() => !starterImage.url && handleOpenFilePicker()}
            >
              {starterImage.url ? (
                <>
                  <img
                    src={starterImage.url}
                    alt="Starter upload preview"
                    className={`w-full h-full object-cover ${isNsfw ? 'blur-xl scale-105' : ''
                      }`}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />

                  {isNsfw && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/45">
                      <EyeOff className="text-red-300 mb-3" size={38} />

                      <p className="text-xs font-black uppercase tracking-[0.25em] text-red-200">
                        NSFW Preview Hidden
                      </p>

                      <p className="text-[11px] text-gray-300 mt-2 max-w-xs">
                        Explicit posts will appear blurred in the feed until
                        clicked.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="absolute top-4 right-4 bg-black/60 p-3 rounded-full backdrop-blur-md border border-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    aria-label="Remove starter image"
                  >
                    <X size={18} />
                  </button>

                  <button
                    type="button"
                    className="absolute top-4 left-4 bg-black/60 px-4 py-3 rounded-full backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFilePicker();
                    }}
                  >
                    Change Image
                  </button>

                  <div className="absolute bottom-4 left-4 px-3 py-2 rounded-full bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
                    Protected Preview
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 border-2 border-white/50 text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-[0.45em] md:tracking-[0.7em] rotate-45 pointer-events-none whitespace-nowrap">
                    CREATIVE REVIEW PROOF
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <Upload className="mx-auto mb-4 text-gray-600" size={42} />

                  <p className="text-sm font-black uppercase tracking-widest text-gray-500">
                    Tap to upload your first frame
                  </p>

                  <p className="text-xs text-gray-600 mt-3 max-w-xs">
                    This now opens your hard drive and uploads to Supabase
                    Storage.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Setup Form */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                Caption / Context
              </label>

              <textarea
                placeholder="What were you trying to create? What do you want feedback on?"
                value={starterImage.caption}
                rows={4}
                onChange={(e) =>
                  updateStarterImage({ caption: e.target.value })
                }
                className="w-full bg-brand-gray border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand-accent outline-none resize-none"
              />
            </div>

            {/* Content Rating */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                Content Rating
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                {CONTENT_RATINGS.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => updateStarterImage({ rating })}
                    className={`min-h-[56px] py-4 px-4 text-[11px] font-black uppercase border rounded-2xl transition-all flex items-center justify-between ${getRatingStyles(
                      rating
                    )}`}
                  >
                    <span>{rating}</span>

                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${starterImage.rating === rating
                          ? 'bg-white text-black border-white'
                          : 'border-current opacity-40'
                        }`}
                    >
                      {starterImage.rating === rating && (
                        <Check size={13} strokeWidth={4} />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Safe shows normally. Suggestive gets labeled. Explicit/NSFW is
                blurred in feeds until opened.
              </p>
            </div>

            {/* Honesty Level */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                Honesty Level
              </label>

              <div className="flex flex-col gap-3">
                {HONESTY_LEVELS.map((level) => {
                  const isSelected = starterImage.honesty === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateStarterImage({ honesty: level })}
                      className={`min-h-[56px] w-full py-4 text-[11px] font-black uppercase border rounded-2xl transition-all text-left px-5 flex items-center justify-between ${isSelected
                          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                          : 'border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                    >
                      {level}

                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected
                            ? 'bg-brand-accent border-brand-accent text-brand-black'
                            : 'border-white/20'
                          }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={4} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                What should people review?
              </label>

              <div className="flex flex-wrap gap-2">
                {CRITIQUE_CATEGORIES.map((category) => {
                  const isSelected =
                    starterImage.categories.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${isSelected
                          ? 'bg-white text-brand-black border-white'
                          : 'border-white/10 text-gray-400 hover:border-brand-accent hover:text-brand-accent'
                        }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anonymous Critiques */}
            <div className="flex items-start justify-between gap-4 p-4 bg-brand-gray rounded-2xl border border-white/10">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">
                  Allow anonymous critiques
                </p>

                <p className="text-[11px] text-gray-500 mt-1">
                  Users can post feedback as “Anonymous Creative.” Admins can
                  still review abuse later.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateStarterImage({ allowAnon: !starterImage.allowAnon })
                }
                className={`w-12 h-7 rounded-full p-1 transition-all flex-shrink-0 ${starterImage.allowAnon ? 'bg-brand-accent' : 'bg-white/10'
                  }`}
                aria-label="Toggle anonymous critiques"
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-brand-black transition-transform ${starterImage.allowAnon ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="p-4 bg-brand-accent/5 rounded-2xl border border-brand-accent/10 flex items-start gap-3">
              <Info
                size={18}
                className="text-brand-accent flex-shrink-0 mt-0.5"
              />

              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 leading-relaxed">
                Start with one image. You can upload more after your profile is
                active. Less friction, more feedback.
              </p>
            </div>

            {saveError && (
              <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-brand-critique flex-shrink-0 mt-0.5"
                />

                <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                  {saveError}
                </p>
              </div>
            )}

            {/* Desktop Finish Button */}
            <button
              type="button"
              disabled={!isComplete || isSaving}
              onClick={handleFinish}
              className="hidden md:flex w-full min-h-[58px] py-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-[1.01] transition-all disabled:opacity-20 items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading Image
                </>
              ) : (
                <>
                  Enter the Review <Shield size={20} />
                </>
              )}
            </button>
          </motion.section>
        </div>
      </div>

      {/* Mobile Sticky Finish Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-brand-black/90 backdrop-blur-xl border-t border-white/10 z-40">
        <button
          type="button"
          disabled={!isComplete || isSaving}
          onClick={handleFinish}
          className="w-full py-4 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading
            </>
          ) : (
            <>
              Enter the Review <ArrowRight size={18} />
            </>
          )}
        </button>

        {!isComplete && (
          <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-widest leading-relaxed">
            Add one image, rating, honesty level, and review category.
          </p>
        )}

        {saveError && (
          <p className="text-center text-[10px] text-brand-critique mt-2 uppercase tracking-widest leading-relaxed">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}