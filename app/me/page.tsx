'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Newspaper,
    ExternalLink,
    RefreshCw,
    Plus,
    Users,
    Shield,
    Search,
    MessageSquare,
    AlertCircle,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Space {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    is_public: boolean;
    creator_id: string;
    created_at: string;
    members_count: number;
    logo_url: string | null;
    verified: boolean;
    is_member?: boolean;
}

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    category?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [lastNewsUpdate, setLastNewsUpdate] = useState<Date>(new Date());
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [spacesLoading, setSpacesLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [creatingSpace, setCreatingSpace] = useState(false);
    const [joiningSpaces, setJoiningSpaces] = useState<Set<string>>(new Set());
    const [newSpace, setNewSpace] = useState({
        name: '',
        display_name: '',
        description: '',
        is_public: true,
    });

    const fetchNews = async () => {
        try {
            setNewsLoading(true);
            const response = await fetch('/api/news');
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch news');
            }

            const text = result.data;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');

            const educationKeywords = [
                'university', 'college', 'tertiary', 'higher education',
                'kcse', 'kcpe', 'form', 'secondary', 'high school',
                'diploma', 'degree', 'undergraduate', 'postgraduate',
                'student', 'admission', 'campus', 'lecture'
            ];

            const excludeKeywords = [
                'preschool', 'pre-school', 'kindergarten', 'nursery',
                'primary school', 'standard', 'daycare', 'early childhood'
            ];

            const parsedItems: NewsItem[] = [];

            items.forEach((item) => {
                const title = item.querySelector('title')?.textContent || '';
                const link = item.querySelector('link')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || '';
                const description = item.querySelector('description')?.textContent || '';
                const category = item.querySelector('category')?.textContent || '';

                const fullText = `${title} ${description} ${category}`.toLowerCase();

                const hasExcluded = excludeKeywords.some(keyword =>
                    fullText.includes(keyword.toLowerCase())
                );

                const hasEducation = educationKeywords.some(keyword =>
                    fullText.includes(keyword.toLowerCase())
                );

                if (!hasExcluded && (hasEducation || category)) {
                    parsedItems.push({
                        title,
                        link,
                        pubDate,
                        description: description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                        category
                    });
                }
            });

            setNewsItems(parsedItems.slice(0, 8));
            setLastNewsUpdate(new Date());
        } catch (error) {
            console.error('Error fetching news:', error);
            setNewsItems([]);
        } finally {
            setNewsLoading(false);
        }
    };

    const fetchSpaces = async () => {
        if (!user) return;

        try {
            setSpacesLoading(true);
            const response = await fetch(`/api/spaces?userId=${user.id}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch spaces');
            }

            setSpaces(result.data || []);
        } catch (error) {
            console.error('Error fetching spaces:', error);
            setSpaces([]);
        } finally {
            setSpacesLoading(false);
        }
    };

    const handleCreateSpace = async () => {
        if (!user || !newSpace.name || !newSpace.display_name) return;

        try {
            setCreatingSpace(true);

            // Create space via API endpoint
            const response = await fetch('/api/spaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newSpace.name.toLowerCase().replace(/\s+/g, '-'),
                    display_name: newSpace.display_name,
                    description: newSpace.description,
                    is_public: newSpace.is_public,
                    creator_id: user.id,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to create space');
            }

            const createdSpace = result.data;

            // Auto-join the creator to the space
            await joinSpace(createdSpace.id);

            setSpaces([{ ...createdSpace, is_member: true }, ...spaces]);
            setIsCreateDialogOpen(false);
            setNewSpace({
                name: '',
                display_name: '',
                description: '',
                is_public: true,
            });

            // Navigate to the chat room
            router.push(`/me/chat/space/${createdSpace.id}`);
        } catch (error) {
            console.error('Error creating space:', error);

        } finally {
            setCreatingSpace(false);
        }
    };

    const joinSpace = async (spaceId: string) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/spaces/${spaceId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to join space');
            }

            return true;
        } catch (error) {
            console.error('Error joining space:', error);
            throw error;
        }
    };

    const handleSpaceClick = async (space: Space) => {
        if (!user) return;

        // If already a member, go directly to chat
        if (space.is_member) {
            router.push(`/me/chat/space/${space.id}`);
            return;
        }

        // If not a member, join first then go to chat
        setJoiningSpaces(prev => new Set(prev).add(space.id));

        try {
            await joinSpace(space.id);


            // Update the space in the list to show membership
            setSpaces(prev => prev.map(s =>
                s.id === space.id
                    ? { ...s, is_member: true, members_count: s.members_count + 1 }
                    : s
            ));

            // Navigate to chat
            router.push(`/me/chat/space/${space.id}`);
        } catch (error) {

        } finally {
            setJoiningSpaces(prev => {
                const next = new Set(prev);
                next.delete(space.id);
                return next;
            });
        }
    };

    const filteredSpaces = spaces.filter(space =>
        space.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchNews();
        const interval = setInterval(fetchNews, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (user) {
            fetchSpaces();
        }
        setLoading(false);
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner className="text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Spaces Section - 2/3 */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Users className="w-6 h-6 text-primary" />
                                            Featured Spaces
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Join university communities and connect with peers
                                        </CardDescription>
                                    </div>
                                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="gap-2 text-white">
                                                <Plus className="w-4 h-4" />
                                                Create Space
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create a New Space</DialogTitle>
                                                <DialogDescription>
                                                    Set up a community space for your university or interest group
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="space-name">Space Name (URL)</Label>
                                                    <Input
                                                        id="space-name"
                                                        placeholder="e.g., university-of-nairobi"
                                                        value={newSpace.name}
                                                        onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        This will be used in the URL. Use lowercase and hyphens.
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="display-name">Display Name</Label>
                                                    <Input
                                                        id="display-name"
                                                        placeholder="e.g., University of Nairobi"
                                                        value={newSpace.display_name}
                                                        onChange={(e) => setNewSpace({ ...newSpace, display_name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        placeholder="Tell people what this space is about..."
                                                        value={newSpace.description}
                                                        onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="public">Public Space</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Anyone can discover and join
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        id="public"
                                                        checked={newSpace.is_public}
                                                        onCheckedChange={(checked) => setNewSpace({ ...newSpace, is_public: checked })}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={handleCreateSpace}
                                                    disabled={!newSpace.name || !newSpace.display_name || creatingSpace}
                                                    className="text-white"
                                                >
                                                    {creatingSpace ? (
                                                        <>
                                                            <Spinner className="w-4 h-4 mr-2" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        'Create Space'
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search spaces..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {spacesLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Spinner className="text-primary" />
                                    </div>
                                ) : filteredSpaces.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">
                                            {searchQuery ? 'No spaces found' : 'No spaces yet'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {searchQuery
                                                ? 'Try a different search term'
                                                : 'Be the first to create a space for your community'}
                                        </p>
                                        {!searchQuery && (
                                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Space
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-380px)] overflow-y-auto">
                                        {filteredSpaces.map((space) => {
                                            const isJoining = joiningSpaces.has(space.id);

                                            return (
                                                <Card
                                                    key={space.id}
                                                    className="hover:border-primary transition-colors cursor-pointer"
                                                    onClick={() => !isJoining && handleSpaceClick(space)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            <Avatar className="w-12 h-12">
                                                                {space.logo_url ? (
                                                                    <AvatarImage src={space.logo_url} alt={space.display_name} />
                                                                ) : (
                                                                    <AvatarFallback>
                                                                        {space.display_name.substring(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                )}
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="font-semibold truncate">
                                                                        {space.display_name}
                                                                    </h3>
                                                                    {space.verified && (
                                                                        <Badge variant="secondary" className="gap-1">
                                                                            <Shield className="w-3 h-3" />
                                                                            Verified
                                                                        </Badge>
                                                                    )}
                                                                    {space.is_member && (
                                                                        <Badge variant="outline" className="gap-1 bg-green-500 hover:bg-green-600">
                                                                            <Check className="w-3 h-3" />
                                                                            Joined
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                                    {space.description || 'No description available'}
                                                                </p>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="w-3 h-3" />
                                                                            <span>{space.members_count || 0} members</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <MessageSquare className="w-3 h-3" />
                                                                            <span>Active</span>
                                                                        </div>
                                                                    </div>
                                                                    {isJoining && (
                                                                        <Spinner className="w-4 h-4 text-primary" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* News Section - 1/3 */}
                    <div className="lg:col-span-1">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Newspaper className="w-5 h-5 text-primary" />
                                        News
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={fetchNews}
                                        disabled={newsLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                                <CardDescription className="text-xs">
                                    Updated {lastNewsUpdate.toLocaleTimeString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto scrollbar-hide">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        We'll post news here. Journalists and influencers can post news here. Stay tuned!
                                    </AlertDescription>
                                </Alert>
                                {newsLoading && newsItems.length === 0 ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Spinner className="text-primary" />
                                    </div>
                                ) : newsItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No news available
                                    </p>
                                ) : (
                                    newsItems.map((item, index) => (
                                        <a
                                            key={index}
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group"
                                        >
                                            <div className="p-3 rounded-lg border hover:border-primary transition-colors">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                                                        {item.title}
                                                    </h3>
                                                    <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                    {item.description}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    {item.category && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {item.category}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(item.pubDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}