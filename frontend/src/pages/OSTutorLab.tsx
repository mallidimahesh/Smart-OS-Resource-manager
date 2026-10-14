import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  CheckCircle,
  XCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
} from 'lucide-react';

export const OSTutorLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'KNOWLEDGE' | 'QUIZ'>('KNOWLEDGE');
  const [topics, setTopics] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Search in knowledge base
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>('cpu_scheduling');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const t = await api.tutor.getTopics();
        setTopics(t);
        const q = await api.tutor.getQuiz();
        setQuizQuestions(q.questions || []);
      } catch (err) {
        console.error('Error loading tutor content:', err);
      }
    };
    loadContent();
  }, []);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    try {
      const res = await api.tutor.submitQuiz(userAnswers);
      setQuizResult(res);
      setQuizSubmitted(true);
    } catch (err) {
      console.error('Quiz submission error:', err);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <GraduationCap className="h-6 w-6 text-cyan-400" />
          OS Tutor &amp; Viva Voce Practice
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Master core Operating System theory, algorithm derivations, trade-offs, and practice with real Viva Voce quiz questions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('KNOWLEDGE')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'KNOWLEDGE'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Theory Knowledge Base &amp; Viva Q&amp;A
        </button>
        <button
          onClick={() => setActiveTab('QUIZ')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'QUIZ'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Interactive Viva Quiz Mode ({quizQuestions.length} Questions)
        </button>
      </div>

      {/* TAB 1: Theory Knowledge Base */}
      {activeTab === 'KNOWLEDGE' && topics && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search concepts, algorithms, viva questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-4">
            {Object.entries(topics).map(([key, topic]: [string, any]) => {
              const isExpanded = expandedTopic === key;

              return (
                <div
                  key={key}
                  className="rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTopic(isExpanded ? null : key)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{topic.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{topic.description}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-800/80 space-y-4">
                      {topic.concepts?.map((c: any) => (
                        <div key={c.id} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-300 text-sm">{c.name}</span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {c.category}
                            </span>
                          </div>

                          <p className="text-slate-300 leading-relaxed">{c.procedure}</p>

                          {c.advantages && (
                            <div className="text-slate-400">
                              <strong className="text-emerald-400">Advantages:</strong> {c.advantages.join('; ')}
                            </div>
                          )}

                          {c.limitations && (
                            <div className="text-slate-400">
                              <strong className="text-rose-400">Limitations:</strong> {c.limitations.join('; ')}
                            </div>
                          )}

                          {/* Viva Q&A Accordion */}
                          {c.viva_questions && (
                            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                              <span className="text-[11px] font-bold uppercase text-amber-400 block">
                                Viva Voce Questions &amp; Suggested Answers:
                              </span>
                              {c.viva_questions.map((vq: any, vIdx: number) => (
                                <div key={vIdx} className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                                  <div className="font-semibold text-slate-200 flex items-start gap-1.5">
                                    <span className="text-cyan-400">Q:</span>
                                    <span>{vq.q}</span>
                                  </div>
                                  <div className="text-slate-400 pl-4 leading-relaxed">
                                    <strong className="text-emerald-400">Ans:</strong> {vq.a}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Interactive Viva Voce Quiz */}
      {activeTab === 'QUIZ' && (
        <div className="space-y-6">
          {/* Score Header if submitted */}
          {quizSubmitted && quizResult && (
            <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-cyan-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Quiz Evaluation Completed</h3>
                  <p className="text-xs text-slate-300">
                    You scored <strong>{quizResult.correct_count}</strong> out of {quizResult.total_questions} ({quizResult.score_percentage}%)
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Quiz</span>
              </button>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {quizQuestions.map((q, qIndex) => {
              const selectedOption = userAnswers[q.id];
              const evalItem = quizResult?.results?.find((r: any) => r.id === q.id);

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border bg-slate-900/80 shadow-xl transition-all ${
                    quizSubmitted
                      ? evalItem?.is_correct
                        ? 'border-emerald-500/60'
                        : 'border-rose-500/60'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-bold text-cyan-400">
                      Question {qIndex + 1} of {quizQuestions.length}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {q.topic}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mb-3 leading-relaxed">
                    {q.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isChosen = selectedOption === optIdx;
                      let optionClasses = 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700';

                      if (isChosen) {
                        optionClasses = 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-semibold';
                      }

                      if (quizSubmitted && evalItem) {
                        if (optIdx === evalItem.correct_index) {
                          optionClasses = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isChosen && !evalItem.is_correct) {
                          optionClasses = 'bg-rose-950/60 border-rose-500 text-rose-200';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          disabled={quizSubmitted}
                          className={`w-full p-3 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${optionClasses}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && optIdx === evalItem?.correct_index && (
                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                          {quizSubmitted && isChosen && !evalItem?.is_correct && (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation if submitted */}
                  {quizSubmitted && evalItem && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <strong className="text-cyan-400 block mb-1">Explanation:</strong>
                      {evalItem.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizSubmitted && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(userAnswers).length === 0}
                className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40"
              >
                Submit Answers for Grading
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
