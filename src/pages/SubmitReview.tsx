import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Check,
  Info,
  ArrowRight,
  EyeOff,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ContentRating, HonestyLevel } from '../types';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

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

export default function SubmitReview() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [contentRating, setContentRating] = useState<ContentRating | ''>('');
  const [honestyLevel, setHonestyLevel] = useState<HonestyLevel | ''>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isNsfw = contentRating === 'Explicit';

  const canSubmit =
    Boolean(image) &&
    Boolean(imageFile) &&
    Boolean(contentRating) &&
    Boolean(honestyLevel) &&
    selectedCategories.length > 0 &&
    confirmed &&
    !isSubmitting;

  const clearError = () => {
    if (submitError) setSubmitError('');
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      return [...current, category];
    });

    clearError();
  };

  const getRatingStyles = (rating: ContentRating) => {
    const isSelected = contentRating === rating;

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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setSubmitError('Please upload an image file.');
      return;
    }

    if (image && imageFile) {
      URL.revokeObjectURL(image);
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setImageFile(selectedFile);
    setImage(previewUrl);
    clearError();
  };

  const removeImage = () => {
    if (image && imageFile) {
      URL.revokeObjectURL(image);
    }

    setImage(null);
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    clearError();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !imageFile) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('You must be logged in to submit a review request.');
      }

      const fileExtension = getFileExtension(imageFile);
      const filePath = `${user.id}/review-${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const publicImageUrl = publicUrlData.publicUrl;

      const { data: insertedPhoto, error: photoError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          image_url: publicImageUrl,
          storage_path: filePath,
          watermarked_url: publicImageUrl,
          watermarked_storage_path: null,
          caption: caption.trim(),
          content_rating: contentRating,
          honesty_level: honestyLevel,
          feedback_categories: selectedCategories,
          allow_anonymous: allowAnonymous,
          is_starter_upload: false,
          is_hidden: false,
        })
        .select('id')
        .single();

      if (photoError) throw photoError;

      await trackEvent('photo_uploaded', 'SubmitReview', {
        photo_id: insertedPhoto.id,
        content_rating: contentRating,
        honesty_level: honestyLevel,
        category_count: selectedCategories.length,
        allow_anonymous: allowAnonymous,
        has_caption: caption.trim().length > 0,
      });

      navigate('/feed');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while submitting your review request.';

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-28 md:pb-0">
      <header className="space-y-3">
        <p className="text-brand-accent text-xs font-black uppercase tracking-[0.25em]">
          Submit for Review
        </p>

        <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
          CRITIQUE ME
        </h1>

        <p className="text-gray-400 font-medium text-sm md:text-base leading-relaxed">
          Ready for the firing squad? Be precise about what you need help with.
          The better the question, the better the critique.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div
          onClick={() => !image && openFilePicker()}
          className={`aspect-[4/5] sm:aspect-[4/3] rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${image
              ? 'border-solid border-brand-accent'
              : 'border-white/10 bg-brand-gray hover:bg-brand-accent/5 cursor-pointer'
            }`}
        >
          {image ? (
            <div className="relative w-full h-full">
              <img
                src={image}
                alt="New upload preview"
                className={`w-full h-full object-cover ${isNsfw ? 'blur-xl scale-105' : ''
                  }`}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {isNsfw && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40">
                  <EyeOff className="text-red-300 mb-3" size={34} />
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-red-200">
                    NSFW Preview Hidden
                  </p>
                  <p className="text-[11px] text-gray-300 mt-2 max-w-xs">
                    Explicit posts will appear blurred in the feed until clicked.
                  </p>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-5 py-3 md:px-8 md:py-4 border-4 border-white/20 text-white/20 text-xl md:text-3xl font-black uppercase tracking-[0.5em] md:tracking-[1em] rotate-12">
                  PROOF
                </div>
              </div>

              <div className="absolute bottom-4 left-4 px-3 py-2 rounded-full bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
                Protected Preview
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
                className="absolute top-4 left-4 px-4 py-3 bg-black/60 rounded-full text-white border border-white/10 text-[10px] font-black uppercase tracking-widest"
              >
                Change
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute top-4 right-4 p-3 bg-black/60 rounded-full text-white border border-white/10"
                aria-label="Remove image"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center group px-6">
              <Upload
                className="mx-auto mb-4 text-gray-600 group-hover:text-brand-accent transition-colors"
                size={48}
              />

              <p className="text-sm font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                Tap to upload frame
              </p>

              <p className="text-xs text-gray-600 mt-3 max-w-xs">
                This opens your hard drive and uploads to Supabase Storage.
              </p>
            </div>
          )}
        </div>

        <section className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
            Caption / Context
          </label>

          <textarea
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              clearError();
            }}
            placeholder="What were you trying to achieve? What happened behind the scenes?"
            rows={4}
            className="w-full bg-brand-gray border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent outline-none resize-none transition-all"
          />
        </section>

        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
            Content Rating
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONTENT_RATINGS.map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => {
                  setContentRating(rating);
                  clearError();
                }}
                className={`py-4 px-4 text-[11px] font-black uppercase border rounded-2xl transition-all flex items-center justify-between ${getRatingStyles(
                  rating
                )}`}
              >
                <span>{rating}</span>

                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${contentRating === rating
                      ? 'bg-white text-black border-white'
                      : 'border-current opacity-40'
                    }`}
                >
                  {contentRating === rating && <Check size={12} strokeWidth={4} />}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Safe shows normally. Suggestive gets labeled. Explicit/NSFW appears
            blurred in feeds until opened.
          </p>
        </section>

        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
            Honesty Level
          </label>

          <div className="flex flex-col gap-3">
            {HONESTY_LEVELS.map((level) => {
              const isSelected = honestyLevel === level;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setHonestyLevel(level);
                    clearError();
                  }}
                  className={`w-full py-4 text-[11px] font-black uppercase border rounded-2xl transition-all text-left px-5 flex items-center justify-between ${isSelected
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                      : 'border-white/10 text-gray-300 hover:border-white/30'
                    }`}
                >
                  {level}

                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'border-white/20'
                      }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={4} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
            What do you want reviewed?
          </label>

          <div className="flex flex-wrap gap-2">
            {CRITIQUE_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category);

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
        </section>

        <section className="space-y-4">
          <div className="p-4 bg-brand-accent/5 rounded-2xl border border-brand-accent/10 flex items-start gap-3">
            <Info size={18} className="text-brand-accent flex-shrink-0 mt-0.5" />

            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 leading-relaxed">
              Tip: Be specific. Instead of “Is this good?”, ask “Is the color
              grading too magenta for the mood?”
            </p>
          </div>

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
              onClick={() => {
                setAllowAnonymous((current) => !current);
                clearError();
              }}
              className={`w-12 h-7 rounded-full p-1 transition-all flex-shrink-0 ${allowAnonymous ? 'bg-brand-accent' : 'bg-white/10'
                }`}
              aria-label="Toggle anonymous critiques"
            >
              <span
                className={`block w-5 h-5 rounded-full bg-brand-black transition-transform ${allowAnonymous ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmed((current) => !current);
              clearError();
            }}
            className="flex items-start gap-3 text-left"
          >
            <span
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${confirmed
                  ? 'bg-brand-accent border-brand-accent text-brand-black'
                  : 'border-white/20'
                }`}
            >
              {confirmed && <Check size={15} strokeWidth={4} />}
            </span>

            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 leading-relaxed pt-1">
              I confirm I own this work or have permission to post it for critique.
            </span>
          </button>
        </section>

        {submitError && (
          <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-brand-critique flex-shrink-0 mt-0.5"
            />

            <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
              {submitError}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="hidden md:flex w-full py-6 bg-brand-accent text-brand-black rounded-3xl font-black uppercase text-sm tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-20 items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading
            </>
          ) : (
            <>
              Submit For Review <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-brand-black/90 backdrop-blur-xl border-t border-white/10 z-30">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full py-4 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading
            </>
          ) : (
            <>
              Submit For Review <ArrowRight size={18} />
            </>
          )}
        </button>

        {!canSubmit && !isSubmitting && (
          <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-widest">
            Add image, rating, honesty level, category, and permission.
          </p>
        )}

        {submitError && (
          <p className="text-center text-[10px] text-brand-critique mt-2 uppercase tracking-widest">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}