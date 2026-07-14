import React, { useState } from 'react';
import { quizQuestions } from '../data/quizData';
import type { CraiveTypeProfile, QuizAnswer } from '../types';
import { getCraiveType } from '../services/geminiService';
import { SpinnerIcon } from '../components/Icons';

interface CraiveTypeQuizPageProps {
    onQuizComplete: (profile: CraiveTypeProfile) => void;
}

export const CraiveTypeQuizPage: React.FC<CraiveTypeQuizPageProps> = ({ onQuizComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentValue, setCurrentValue] = useState(5);

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100;

    const handleAnswer = async (answerValue: number) => {
        const newAnswer: QuizAnswer = { 
            questionId: currentQuestion.id,
            question: currentQuestion.text,
            answer: answerValue
        };
        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);
        setCurrentValue(5); // Reset slider for the next question

        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setIsLoading(true);
            setError(null);
            try {
                const profile = await getCraiveType(updatedAnswers);
                onQuizComplete(profile);
            } catch (err) {
                setError("Oh no! Our food psychologist hit a snag. Please try again.");
                console.error(err);
                setIsLoading(false);
            }
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in-up">
                <SpinnerIcon />
                <h1 className="text-2xl font-bold text-deep-green mt-4">Analyzing your cravings...</h1>
                <p className="text-lg text-deep-green/80 max-w-md">Mila is crafting your unique food personality profile!</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full p-4 animate-fade-in-up">
            <div className="w-full bg-gold-light/30 rounded-full h-2.5 mb-6">
                <div className="bg-gold h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center text-center">
                <p className="text-sm font-bold text-deep-green/60 mb-2">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
                <h2 className="text-2xl font-semibold text-deep-green mb-8 max-w-md">{currentQuestion.text}</h2>
                
                <div className="w-full max-w-sm">
                    <div className="text-center mb-4">
                        <span className="text-2xl font-bold text-deep-green">{currentValue}</span>
                        <span className="text-lg text-deep-green/70">/10</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gold-light/50 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                    <div className="flex justify-between text-xs font-semibold text-deep-green/70 mt-2 px-1">
                        <span>Disagree</span>
                        <span>Neutral</span>
                        <span>Agree</span>
                    </div>
                </div>

                <div className="mt-12">
                     <button
                        onClick={() => handleAnswer(currentValue)}
                        className="px-12 py-3 bg-gold text-white font-bold rounded-full shadow-lg hover:bg-deep-green transition-all duration-300 transform hover:scale-105"
                    >
                        Confirm
                    </button>
                </div>

                {error && <p className="text-red-500 mt-8">{error}</p>}
            </div>
        </div>
    );
};