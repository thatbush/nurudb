'use client';

import { useUploadFile } from '@better-upload/client';
import { Upload, X, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseProxy } from '@/lib/supabaseProxy';
import SplitText from '@/components/SplitText';
import { useRouter } from 'next/navigation';

interface University {
    id: string;
    name: string;
}

function UniversitySelect({
    universities,
    selectedUniversity,
    onSelect,
    loading,
    disabled,
}: {
    universities: University[];
    selectedUniversity: University | null;
    onSelect: (uni: University) => void;
    loading: boolean;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredUnis = universities.filter((uni) =>
        uni.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between cursor-pointer"
                        disabled={loading || disabled}
                    >
                        <span>
                            {loading ? 'Loading universities...' : selectedUniversity?.name || 'Choose a university'}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-0">
                    <div className="sticky top-0 p-2 border-b bg-background">
                        <Input
                            placeholder="Search universities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {filteredUnis.length === 0 ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">
                                No universities found
                            </div>
                        ) : (
                            <>
                                <DropdownMenuLabel className="px-2 py-1.5 text-xs">
                                    {filteredUnis.length} result{filteredUnis.length !== 1 ? 's' : ''}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {filteredUnis.map((uni) => (
                                    <DropdownMenuItem
                                        key={uni.id}
                                        onClick={() => {
                                            onSelect(uni);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className="cursor-pointer px-2 py-2"
                                    >
                                        {uni.name}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function GraduationUpload() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [universities, setUniversities] = useState<University[]>([]);
    const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Fetch universities
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                setLoading(true);
                const uniRes = await supabaseProxy.select('universities');
                const normalize = (res: any) =>
                    Array.isArray(res) ? res : res?.data || [];
                const unis = normalize(uniRes);
                setUniversities(unis);
            } catch (err) {
                console.error('Failed to fetch universities:', err);
                setError('Failed to load universities');
            } finally {
                setLoading(false);
            }
        };

        fetchUniversities();
    }, []);

    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
    }, []);

    const { control, isPending } = useUploadFile({
        route: 'graduation',
    });

    const saveUploadToUniversity = async (fileUrl: string) => {
        if (!selectedUniversity) return;

        try {
            // Fetch current university record
            const uni = await supabaseProxy.selectById('universities', selectedUniversity.id);

            if (!uni) {
                setError('University not found');
                return;
            }

            // Add new image to array
            const currentImages = Array.isArray(uni.imagesUrl) ? uni.imagesUrl : [];
            const updatedImages = [...currentImages, fileUrl];

            // Update the university with new images array
            await supabaseProxy.update('universities', selectedUniversity.id, {
                imagesUrl: updatedImages
            });

            // Reset form
            handleRemoveFile();
            setSelectedUniversity(null);
        } catch (err) {
            console.error('Failed to update university images:', err);
            setError('Photo uploaded but failed to save to profile');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setError(null);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setFile(selectedFile);
    };

    const handleRemoveFile = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedUniversity) {
            setError('Please select both a photo and a university');
            return;
        }

        // Upload file - better-upload will handle the upload
        // We'll get the URL from the response/result
        try {
            const result = await control.upload(file);

            // Extract the file URL from better-upload result
            // The exact property may vary - check better-upload docs
            const filename = result.file.objectInfo.key;
            const fileUrl = 'https://pub-2fa97689f2a54afab8c9ae246e67faea.r2.dev/' + filename;

            if (fileUrl) {
                await saveUploadToUniversity(fileUrl);
            } else {
                setError('Upload succeeded but could not retrieve file URL');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload photo');
        }
    };

    const handleAnimationComplete = () => {
        console.log('Animation complete');
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="">
                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-6 items-start max-w-8xl mx-auto">

                    {/* Left Column - Information */}
                    <div className="space-y-6">
                        <div className='w-full h-full'>
                            {/* Congratulations WEBP */}
                            <img src="/winner.webp" alt="Congratulations" className='w-full h-full object-cover' />
                        </div>
                    </div>

                    {/* Right Column - Upload Form */}
                    <div className="space-y-6 px-4 p-8">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="text-center lg:text-left mb-8">
                            <SplitText
                                text="Congratulations!"
                                className="text-4xl lg:text-7xl font-bold text-primary"
                                delay={90}
                                duration={0.7}
                                ease="power3.out"
                                splitType="chars"
                                from={{ opacity: 0, y: 40 }}
                                to={{ opacity: 1, y: 0 }}
                                threshold={0.4}
                                rootMargin="-100px"
                                textAlign="left"
                                onLetterAnimationComplete={handleAnimationComplete}
                            />
                        </div>

                        <div>
                            <p className='text-primary text-2xl'>
                                It's time to show off! We bet you'd look great on our winners globe. <br /> <br />Upload your favorite graduation photo and let the world see your achievement!
                            </p>
                        </div>

                        {/* University Dropdown */}
                        <div>
                            <label className="block text-sm font-medium mb-3">
                                Select Your University <span className="text-red-500">*</span>
                            </label>
                            <UniversitySelect
                                universities={universities}
                                selectedUniversity={selectedUniversity}
                                onSelect={setSelectedUniversity}
                                loading={loading}
                                disabled={isPending}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-4">
                                Graduation Photo <span className="text-red-500">*</span>
                            </label>

                            <div className="relative w-full max-w-9xl mx-auto lg:mx-0">
                                {/* SVG Background */}
                                <img
                                    src={darkMode ? '/wg-input-dark.png' : '/wg-input.png'}
                                    alt="Background"
                                    className="w-full md:h-auto h-[300px] rounded-lg object-cover"
                                />

                                {/* Centered Circle Overlay */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[40%] w-[50%] aspect-square">
                                    {!previewUrl ? (
                                        <div
                                            onClick={() => !isPending && fileInputRef.current?.click()}
                                            className={`w-full h-full rounded-full border-4 border-dashed border-white/30 bg-primary/10 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-white/50 hover:bg-primary/20 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                disabled={isPending}
                                            />
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="w-12 h-12 text-secondary/70 mb-2 animate-spin" />
                                                    <p className="text-secondary/70 text-sm font-medium">Uploading...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-12 h-12 text-secondary/70 mb-2" />
                                                    <p className="text-secondary/70 text-sm font-medium">Click to upload</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                                            />
                                            {!isPending && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg z-10"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upload and Cancel Buttons */}
                        {previewUrl && !isPending && (
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleUpload}
                                    disabled={!selectedUniversity}
                                    className="flex-1 cursor-pointer"
                                >
                                    Approve & Upload
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleRemoveFile}
                                    className="flex-1 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {isPending && (
                            <div className="text-center lg:text-left text-sm text-muted-foreground">
                                Uploading your photo...
                            </div>
                        )}

                        <div className="text-center lg:text-left mb-8 mt-12">
                            <h2 className="text-3xl lg:text-4xl font-bold text-primary">What next?</h2>
                        </div>

                        <div className="mt-6">
                            <p className="text-lg text-primary leading-relaxed">
                                We need your help to make Nuru an accurate and reliable resource for students.
                                <br /> <br />
                                <b>Join our mission as an alumni!</b> Empower students just starting out with first hand information about your university.
                            </p>
                        </div>
                        <div className="mt-6 flex flex-col lg:flex-row gap-4">
                            <Button
                                variant="default"
                                size="lg"
                                className="w-full lg:w-auto cursor-pointer text-white"
                                onClick={() => router.push('/institutions')}
                            >
                                Look around
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full lg:w-auto cursor-pointer"
                                onClick={() => router.push('/me')}
                            >
                                Contribute →
                            </Button>
                        </div>

                        {/* Footer */}
                        <section className='mt-16 bottom-1 left-0 right-0'>
                            <div className='grid grid-cols-2'>
                                <div>
                                    <p className='text-primary text-sm'>© {new Date().getFullYear()} Nuru. All rights reserved.</p>
                                </div>
                                <div className='flex justify-end'>
                                    <p className='text-primary text-sm'><a href='/terms' className='text-primary hover:underline'>Terms of Service</a> | <a href='/privacy' className='text-primary hover:underline'>Privacy Policy</a></p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}