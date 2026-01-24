import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const posts = [
        {
            id: 1,
            title: "The Ultimate Guide to Finding the Best Salon in Nagpur",
            excerpt: "From Dharampeth to Sitabuldi, discover the top-rated grooming spots that are redefining luxury in the Orange City.",
            date: "Jan 24, 2026",
            author: "Om Patil",
            category: "Local Guide",
            image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
            readTime: "5 min read"
        },
        {
            id: 2,
            title: "5 Beard Styles Trending in Amravati This Season",
            excerpt: "Whether you're in Rajapeth or Camp, these beard styles are turning heads. Learn how to maintain the perfect fade.",
            date: "Jan 20, 2026",
            author: "David Chen",
            category: "Grooming Tips",
            image: "https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=800&q=80",
            readTime: "4 min read"
        },
        {
            id: 3,
            title: "Why Online Booking is the Future of Barbershops",
            excerpt: "Stop waiting in queues. Discover how GlossCut's instant booking system is saving time for thousands of clients.",
            date: "Jan 15, 2026",
            author: "Sarah Jenkins",
            category: "Technology",
            image: "https://images.unsplash.com/photo-1599351436213-9971f64d6bad?w=800&q=80",
            readTime: "3 min read"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-amber-500/30 pt-24 pb-20 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-bold tracking-widest uppercase"
                    >
                        <BookOpen size={14} />
                        The GlossCut Journal
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold text-white font-serif"
                    >
                        Stories of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">Style</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto text-lg"
                    >
                        Expert grooming advice, local city guides, and inside stories from the world of premium barbering.
                    </motion.p>
                </div>

                {/* Featured Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all hover:-translate-y-2"
                        >
                            {/* Image */}
                            <div className="h-48 overflow-hidden relative">
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-bold text-white border border-white/10 flex items-center gap-1">
                                        <Tag size={10} className="text-amber-500" /> {post.category}
                                    </span>
                                </div>
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-mono">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                                    <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors line-clamp-2 leading-tight">
                                    {post.title}
                                </h2>

                                <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                                    {post.excerpt}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <span className="text-xs text-gray-600 font-mono">{post.readTime}</span>
                                    <button className="text-sm font-bold text-amber-500 flex items-center gap-1 group/btn">
                                        Read Article <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* Newsletter CTA */}
                <section className="mt-20 p-12 bg-gradient-to-r from-[#1a1a1a] to-[#111] rounded-3xl border border-white/5 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/5 blur-[100px] rounded-full"></div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-4 relative z-10">Use The GlossCut App</h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-8 relative z-10">
                        Get the latest grooming trends and exclusive offers directly on your device.
                    </p>
                    <div className="flex justify-center relative z-10">
                        <Link to="/all-services-search" className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
                            Book Now
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Blog;
