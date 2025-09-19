import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  Play, 
  Download, 
  Youtube, 
  Search,
  Filter,
  Eye,
  Clock,
  Calendar,
  TrendingUp
} from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  createdAt: string;
  status: 'uploaded' | 'draft' | 'processing';
  youtubeUrl?: string;
}

export const VideoGallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [videos] = useState<VideoItem[]>([
    {
      id: '1',
      title: 'Transform Your Life Today - Motivational Speech',
      thumbnail: '/placeholder.svg',
      duration: '4:23',
      views: '125K',
      createdAt: '2024-01-15',
      status: 'uploaded',
      youtubeUrl: 'https://youtube.com/watch?v=example1'
    },
    {
      id: '2',
      title: 'Success Mindset: 5 Keys to Achievement',
      thumbnail: '/placeholder.svg',
      duration: '3:42',
      views: '89K',
      createdAt: '2024-01-14',
      status: 'uploaded',
      youtubeUrl: 'https://youtube.com/watch?v=example2'
    },
    {
      id: '3',
      title: 'Motivational Monday: Unlock Your Potential',
      thumbnail: '/placeholder.svg',
      duration: '5:18',
      views: '203K',
      createdAt: '2024-01-13',
      status: 'uploaded',
      youtubeUrl: 'https://youtube.com/watch?v=example3'
    },
    {
      id: '4',
      title: 'Daily Inspiration: Never Give Up',
      thumbnail: '/placeholder.svg',
      duration: '2:55',
      views: '67K',
      createdAt: '2024-01-12',
      status: 'draft'
    },
    {
      id: '5',
      title: 'Breakthrough Your Limits',
      thumbnail: '/placeholder.svg',
      duration: '4:07',
      views: '0',
      createdAt: '2024-01-15',
      status: 'processing'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge className="bg-success/20 text-success border-success/30">Uploaded</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'processing':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Processing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || video.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Video Gallery
          </CardTitle>
          <CardDescription>
            Browse and manage your generated videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/20 border-border/50"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-secondary/20 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-secondary/20 border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card 
            key={video.id} 
            className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow/20 transition-all duration-300 group"
          >
            <div className="relative">
              <div className="aspect-video bg-secondary/20 rounded-t-lg overflow-hidden">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="sm" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="absolute top-2 right-2">
                {getStatusBadge(video.status)}
              </div>
              
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                {video.duration}
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {video.title}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {video.views}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.createdAt)}
                </div>
              </div>
              
              <div className="flex gap-2">
                {video.status === 'uploaded' && video.youtubeUrl ? (
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <Youtube className="w-4 h-4 mr-2" />
                      View
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                )}
                
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredVideos.length === 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardContent className="p-12 text-center">
            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No videos found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};