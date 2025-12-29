import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  BookOpen,
  Clock,
  Target,
  Heart,
  Star,
  CheckCircle
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BookCard from '../components/books/BookCard';
import recommendationService from '../services/recommendationService';
import aiService from '../services/aiService';

const AIQuiz = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const sampleQuestions = [
    {
      id: 1,
      question: "What's your primary reading goal?",
      icon: <Target className="h-6 w-6" />,
      options: [
        { id: 'A', text: 'Entertainment and escape', value: ['fiction', 'entertainment'] },
        { id: 'B', text: 'Learning and self-improvement', value: ['non-fiction', 'learning'] },
        { id: 'C', text: 'Professional development', value: ['business', 'professional'] },
        { id: 'D', text: 'Emotional connection', value: ['romance', 'drama', 'emotional'] }
      ]
    },
    {
      id: 2,
      question: "How much time do you typically have for reading?",
      icon: <Clock className="h-6 w-6" />,
      options: [
        { id: 'A', text: 'Quick reads during breaks', value: ['short', 'quick'] },
        { id: 'B', text: '1-2 hours weekly', value: ['medium', 'moderate'] },
        { id: 'C', text: 'Regular reader, several hours weekly', value: ['regular', 'consistent'] },
        { id: 'D', text: 'Voracious reader, daily', value: ['long', 'voracious'] }
      ]
    },
    {
      id: 3,
      question: "Which genres appeal to you most?",
      icon: <BookOpen className="h-6 w-6" />,
      options: [
        { id: 'A', text: 'Mystery & Thriller', value: ['mystery', 'thriller'] },
        { id: 'B', text: 'Science Fiction & Fantasy', value: ['science fiction', 'fantasy'] },
        { id: 'C', text: 'Biography & History', value: ['biography', 'history'] },
        { id: 'D', text: 'Self-Help & Psychology', value: ['self-help', 'psychology'] },
        { id: 'E', text: 'Romance & Drama', value: ['romance', 'drama'] }
      ]
    },
    {
      id: 4,
      question: "What's your preferred reading format?",
      icon: <Heart className="h-6 w-6" />,
      options: [
        { id: 'A', text: 'Physical books (I love the feel)', value: ['physical', 'tactile'] },
        { id: 'B', text: 'E-books (Convenient and portable)', value: ['ebook', 'digital'] },
        { id: 'C', text: 'Audiobooks (Multitasking friendly)', value: ['audiobook', 'audio'] },
        { id: 'D', text: 'No preference', value: ['any'] }
      ]
    },
    {
      id: 5,
      question: "How do you choose your next book?",
      icon: <Star className="h-6 w-6" />,
      options: [
        { id: 'A', text: 'Bestseller lists and awards', value: ['popular', 'award-winning'] },
        { id: 'B', text: 'Friend recommendations', value: ['social', 'recommended'] },
        { id: 'C', text: 'Author I already love', value: ['author-focused', 'familiar'] },
        { id: 'D', text: 'Cover and blurb catch my eye', value: ['visual', 'spontaneous'] }
      ]
    }
  ];

  useEffect(() => {
    setQuestions(sampleQuestions);
  }, []);

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!user) {
      toast.error('Please login to get personalized recommendations');
      navigate('/login');
      return;
    }

    if (Object.keys(answers).length < questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      setGenerating(true);
      
      // Format answers for AI
      const formattedAnswers = {
        genres: [],
        preferences: [],
        readingHabits: []
      };

      questions.forEach((q, index) => {
        const answerId = answers[q.id];
        if (answerId) {
          const option = q.options.find(opt => opt.id === answerId);
          if (option) {
            formattedAnswers.genres.push(...option.value.filter(v => 
              ['fiction', 'non-fiction', 'mystery', 'thriller', 'science fiction', 
               'fantasy', 'biography', 'history', 'self-help', 'psychology', 
               'romance', 'drama', 'business'].includes(v)
            ));
            formattedAnswers.preferences.push(...option.value.filter(v => 
              ['entertainment', 'learning', 'professional', 'emotional', 
               'short', 'quick', 'medium', 'moderate', 'regular', 'consistent',
               'long', 'voracious', 'physical', 'tactile', 'ebook', 'digital',
               'audiobook', 'audio', 'any', 'popular', 'award-winning', 
               'social', 'recommended', 'author-focused', 'familiar', 
               'visual', 'spontaneous'].includes(v)
            ));
          }
        }
      });

      // Get AI-powered recommendations
      const recommendationsData = await recommendationService.getQuizRecommendations(
        JSON.stringify(formattedAnswers)
      );

      setRecommendations(recommendationsData.recommendations || []);
      setQuizComplete(true);
      toast.success('Your personalized recommendations are ready!');

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const currentQuestion = questions[step - 1];
  const progress = (step / questions.length) * 100;

  if (generating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <Brain className="h-24 w-24 text-accent mx-auto animate-pulse" />
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-gold-500 animate-ping" />
          </div>
          <h2 className="text-3xl font-display font-bold text-primary mb-4">
            Analyzing Your Answers...
          </h2>
          <p className="text-gray-600 mb-8">
            Our AI is finding the perfect books for you
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-navy-50">
        <div className="section-padding">
          <div className="container-custom">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="relative inline-block mb-6">
                <CheckCircle className="h-20 w-20 text-accent mx-auto" />
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-gold-500" />
              </div>
              <h1 className="text-4xl font-display font-bold text-primary mb-4">
                Your Personalized Book Matches
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Based on your quiz answers, we've found {recommendations.length} 
                books we think you'll love
              </p>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {recommendations.map((rec, index) => (
                <div 
                  key={rec.book._id} 
                  className="card p-6 hover:shadow-book-hover transition-all duration-300"
                >
                  {/* Book Card */}
                  <div className="flex gap-4 mb-4">
                    <img 
                      src={rec.book.coverImage} 
                      alt={rec.book.title}
                      className="w-20 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-primary mb-1">
                        {rec.book.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        by {rec.book.author?.name}
                      </p>
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-gold-500 fill-current mr-1" />
                        <span className="font-medium">
                          {rec.book.ratings.average?.toFixed(1) || '4.5'}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">
                          ({rec.book.ratings.count?.toLocaleString() || 0})
                        </span>
                      </div>
                      {/* Match Score */}
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Match Score</span>
                          <span className="font-bold text-accent">
                            {Math.round(rec.score * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${rec.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-accent/5 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-primary">Why you'll love it:</span>{' '}
                      {rec.reason || 'Perfect match for your reading preferences'}
                    </p>
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {rec.book.genres?.slice(0, 3).map((genre) => (
                      <span 
                        key={genre}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(`/book/${rec.book._id}`)}
                    className="btn-primary w-full mt-4"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Not satisfied with these recommendations?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setQuizComplete(false);
                    setStep(1);
                    setAnswers({});
                  }}
                  className="btn-outline"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="btn-primary"
                >
                  Explore More Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-white">
      <div className="section-padding">
        <div className="container-custom max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {step} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quiz Content */}
          <div className="card p-8 mb-8">
            {/* Question Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-accent/10 rounded-lg">
                {currentQuestion?.icon}
              </div>
              <div>
                <div className="text-sm text-accent font-medium mb-1">
                  Question {step}
                </div>
                <h2 className="text-2xl font-display font-bold text-primary">
                  {currentQuestion?.question}
                </h2>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion?.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    answers[currentQuestion.id] === option.id
                      ? 'border-accent bg-accent/10'
                      : 'border-gray-200 hover:border-accent hover:bg-accent/5'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-4 ${
                      answers[currentQuestion.id] === option.id
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.id}
                    </div>
                    <span className="text-lg">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center px-6 py-3 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </button>
              
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion?.id]}
                className="btn-primary flex items-center"
              >
                {step === questions.length ? 'Get Recommendations' : 'Next'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-gray-600 mb-4">
              <Brain className="h-5 w-5" />
              <span className="font-medium">AI-Powered Recommendations</span>
            </div>
            <p className="text-gray-600">
              Our AI analyzes your answers to find books that match your unique preferences.
              The more questions you answer, the better the recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuiz;