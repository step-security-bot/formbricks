import { EndingCard } from "@/components/general/EndingCard";
import { FormbricksBranding } from "@/components/general/FormbricksBranding";
import { LanguageSwitch } from "@/components/general/LanguageSwitch";
import { ProgressBar } from "@/components/general/ProgressBar";
import { QuestionConditional } from "@/components/general/QuestionConditional";
import { ResponseErrorComponent } from "@/components/general/ResponseErrorComponent";
import { SurveyCloseButton } from "@/components/general/SurveyCloseButton";
import { WelcomeCard } from "@/components/general/WelcomeCard";
import { AutoCloseWrapper } from "@/components/wrappers/AutoCloseWrapper";
import { StackedCardsContainer } from "@/components/wrappers/StackedCardsContainer";
import { evaluateAdvancedLogic, performActions } from "@/lib/logicEvaluator";
import { parseRecallInformation, replaceRecallInfo } from "@/lib/recall";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { SurveyBaseProps } from "@formbricks/types/formbricks-surveys";
import type {
  TResponseData,
  TResponseDataValue,
  TResponseTtc,
  TResponseVariables,
} from "@formbricks/types/responses";
import { TSurvey, TSurveyQuestion } from "@formbricks/types/surveys/types";

export const Survey = ({
  survey,
  styling,
  isBrandingEnabled,
  onDisplay = () => {},
  onResponse = () => {},
  onClose = () => {},
  onFinished = () => {},
  onRetry = () => {},
  isRedirectDisabled = false,
  prefillResponseData,
  skipPrefilled,
  languageCode,
  getSetIsError,
  getSetIsResponseSendingFinished,
  getSetQuestionId,
  onFileUpload,
  responseCount,
  startAtQuestionId,
  hiddenFieldsRecord,
  clickOutside,
  shouldResetQuestionId,
  fullSizeCards = false,
  autoFocus,
}: SurveyBaseProps) => {
  const [localSurvey, setlocalSurvey] = useState<TSurvey>(survey);

  const autoFocusEnabled = autoFocus !== undefined ? autoFocus : window.self === window.top;

  const [questionId, setQuestionId] = useState(() => {
    if (startAtQuestionId) {
      return startAtQuestionId;
    } else if (localSurvey.welcomeCard.enabled) {
      return "start";
    } else {
      return localSurvey?.questions[0]?.id;
    }
  });
  const [showError, setShowError] = useState(false);
  // flag state to store whether response processing has been completed or not, we ignore this check for survey editor preview and link survey preview where getSetIsResponseSendingFinished is undefined
  const [isResponseSendingFinished, setIsResponseSendingFinished] = useState(
    getSetIsResponseSendingFinished ? false : true
  );
  const [selectedLanguage, setselectedLanguage] = useState(languageCode);
  const [loadingElement, setLoadingElement] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [responseData, setResponseData] = useState<TResponseData>(hiddenFieldsRecord ?? {});
  const [responseVariables, setResponseVariables] = useState<TResponseVariables>({});

  const [ttc, setTtc] = useState<TResponseTtc>({});
  const questionIds = useMemo(
    () => localSurvey.questions.map((question) => question.id),
    [localSurvey.questions]
  );
  const cardArrangement = useMemo(() => {
    if (localSurvey.type === "link") {
      return styling.cardArrangement?.linkSurveys ?? "straight";
    } else {
      return styling.cardArrangement?.appSurveys ?? "straight";
    }
  }, [localSurvey.type, styling.cardArrangement?.linkSurveys, styling.cardArrangement?.appSurveys]);

  const currentQuestionIndex = localSurvey.questions.findIndex((q) => q.id === questionId);
  const currentQuestion = useMemo(() => {
    if (!questionIds.includes(questionId)) {
      const newHistory = [...history];
      const prevQuestionId = newHistory.pop();
      return localSurvey.questions.find((q) => q.id === prevQuestionId);
    } else {
      return localSurvey.questions.find((q) => q.id === questionId);
    }
  }, [questionId, localSurvey, history]);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const showProgressBar = !styling.hideProgressBar;
  const getShowSurveyCloseButton = (offset: number) => {
    return offset === 0 && localSurvey.type !== "link" && (clickOutside === undefined ? true : clickOutside);
  };
  const getShowLanguageSwitch = (offset: number) => {
    return localSurvey.showLanguageSwitch && localSurvey.languages.length > 0 && offset <= 0;
  };

  useEffect(() => {
    // scroll to top when question changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [questionId]);

  useEffect(() => {
    // call onDisplay when component is mounted
    onDisplay();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (getSetIsError) {
      getSetIsError((value: boolean) => {
        setShowError(value);
      });
    }
  }, [getSetIsError]);

  useEffect(() => {
    if (getSetQuestionId) {
      getSetQuestionId((value: string) => {
        setQuestionId(value);
      });
    }
  }, [getSetQuestionId]);

  useEffect(() => {
    if (getSetIsResponseSendingFinished) {
      getSetIsResponseSendingFinished((value: boolean) => {
        setIsResponseSendingFinished(value);
      });
    }
  }, [getSetIsResponseSendingFinished]);

  useEffect(() => {
    setselectedLanguage(languageCode);
  }, [languageCode]);

  let currIdxTemp = currentQuestionIndex;
  let currQuesTemp = currentQuestion;

  const onChange = (responseDataUpdate: TResponseData) => {
    const updatedResponseData = { ...responseData, ...responseDataUpdate };
    setResponseData(updatedResponseData);
  };

  const onChangeVariables = (variables: TResponseVariables) => {
    const updatedVariables = { ...responseVariables, ...variables };
    setResponseVariables(updatedVariables);
  };

  const makeQuestionsRequired = (questionIds: string[]): void => {
    const localSurveyClone = structuredClone(localSurvey);
    localSurveyClone.questions.forEach((question) => {
      if (questionIds.includes(question.id)) {
        question.required = true;
      }
    });

    setlocalSurvey(localSurveyClone);
  };

  const getNextQuestionId = (
    survey: { questions: TSurveyQuestion[]; endings: { id: string }[] },
    questionId: string,
    data: TResponseData,
    selectedLanguage: string
  ): string | undefined => {
    const questions = survey.questions;
    const firstEndingId = survey.endings.length > 0 ? survey.endings[0].id : undefined;

    if (questionId === "start") return questions[0]?.id || firstEndingId;

    if (currIdxTemp === -1) throw new Error("Question not found");

    let firstJumpTarget: string | undefined;
    const allRequiredQuestionIds: string[] = [];
    const calculationResults: Record<string, number | string> = {};

    if (currQuesTemp?.logic && currQuesTemp.logic.length > 0) {
      for (const logic of currQuesTemp.logic) {
        if (evaluateAdvancedLogic(localSurvey, data, logic.conditions, selectedLanguage)) {
          const { jumpTarget, requiredQuestionIds, calculations } = performActions(
            localSurvey,
            logic.actions,
            data
          );

          if (jumpTarget && !firstJumpTarget) {
            firstJumpTarget = jumpTarget;
          }

          allRequiredQuestionIds.push(...requiredQuestionIds);
          Object.assign(calculationResults, calculations);
        }
      }
    }

    // Update response variables with all calculation results
    onChangeVariables(calculationResults);

    // Make all collected questions required
    if (allRequiredQuestionIds.length > 0) {
      makeQuestionsRequired(allRequiredQuestionIds);
    }

    // Return the first jump target if found, otherwise go to the next question or ending
    return firstJumpTarget || questions[currentQuestionIndex + 1]?.id || firstEndingId;
  };

  const onSubmit = (responseData: TResponseData, ttc: TResponseTtc) => {
    const questionId = Object.keys(responseData)[0];
    setLoadingElement(true);
    const nextQuestionId = getNextQuestionId(localSurvey, questionId, responseData, selectedLanguage);
    const finished =
      nextQuestionId === undefined ||
      !localSurvey.questions.map((question) => question.id).includes(nextQuestionId);
    onChange(responseData);
    onResponse({
      data: responseData,
      ttc,
      finished,
      variables: responseVariables,
      language: selectedLanguage,
    });
    if (finished) {
      // Post a message to the parent window indicating that the survey is completed.
      window.parent.postMessage("formbricksSurveyCompleted", "*");
      onFinished();
    }
    if (nextQuestionId) {
      setQuestionId(nextQuestionId);
    }
    // add to history
    setHistory([...history, questionId]);
    setLoadingElement(false);
  };

  const onBack = (): void => {
    let prevQuestionId;
    // use history if available
    if (history?.length > 0) {
      const newHistory = [...history];
      prevQuestionId = newHistory.pop();
      setHistory(newHistory);
    } else {
      // otherwise go back to previous question in array
      prevQuestionId = localSurvey.questions[currIdxTemp - 1]?.id;
    }
    if (!prevQuestionId) throw new Error("Question not found");
    setQuestionId(prevQuestionId);
  };

  const getQuestionPrefillData = (questionId: string, offset: number): TResponseDataValue | undefined => {
    if (offset === 0 && prefillResponseData) {
      return prefillResponseData[questionId];
    }
    return undefined;
  };

  const getCardContent = (questionIdx: number, offset: number): JSX.Element | undefined => {
    if (showError) {
      return (
        <ResponseErrorComponent
          responseData={responseData}
          questions={localSurvey.questions}
          onRetry={onRetry}
        />
      );
    }

    const content = () => {
      if (questionIdx === -1) {
        return (
          <WelcomeCard
            key="start"
            headline={localSurvey.welcomeCard.headline}
            html={localSurvey.welcomeCard.html}
            fileUrl={localSurvey.welcomeCard.fileUrl}
            buttonLabel={localSurvey.welcomeCard.buttonLabel}
            onSubmit={onSubmit}
            survey={localSurvey}
            languageCode={selectedLanguage}
            responseCount={responseCount}
            autoFocusEnabled={autoFocusEnabled}
            replaceRecallInfo={replaceRecallInfo}
            isCurrent={offset === 0}
            responseData={responseData}
          />
        );
      } else if (questionIdx >= localSurvey.questions.length) {
        const endingCard = localSurvey.endings.find((ending) => {
          return ending.id === questionId;
        });
        if (endingCard) {
          return (
            <EndingCard
              survey={localSurvey}
              endingCard={endingCard}
              isRedirectDisabled={isRedirectDisabled}
              autoFocusEnabled={autoFocusEnabled}
              isCurrent={offset === 0}
              languageCode={selectedLanguage}
              isResponseSendingFinished={isResponseSendingFinished}
              responseData={responseData}
            />
          );
        }
      } else {
        const question = localSurvey.questions[questionIdx];
        return (
          question && (
            <QuestionConditional
              key={question.id}
              surveyId={localSurvey.id}
              question={parseRecallInformation(
                question,
                selectedLanguage,
                responseData,
                localSurvey.variables
              )}
              value={responseData[question.id]}
              onChange={onChange}
              onSubmit={onSubmit}
              onBack={onBack}
              ttc={ttc}
              setTtc={setTtc}
              onFileUpload={onFileUpload}
              isFirstQuestion={question.id === localSurvey?.questions[0]?.id}
              skipPrefilled={skipPrefilled}
              prefilledQuestionValue={getQuestionPrefillData(question.id, offset)}
              isLastQuestion={question.id === localSurvey.questions[localSurvey.questions.length - 1].id}
              languageCode={selectedLanguage}
              autoFocusEnabled={autoFocusEnabled}
              currentQuestionId={questionId}
            />
          )
        );
      }
    };

    return (
      <AutoCloseWrapper survey={localSurvey} onClose={onClose} offset={offset}>
        <div
          className={cn(
            "fb-no-scrollbar md:fb-rounded-custom fb-rounded-t-custom fb-bg-survey-bg fb-flex fb-h-full fb-w-full fb-flex-col fb-justify-between fb-overflow-hidden fb-transition-all fb-duration-1000 fb-ease-in-out",
            cardArrangement === "simple" ? "fb-survey-shadow" : "",
            offset === 0 || cardArrangement === "simple" ? "fb-opacity-100" : "fb-opacity-0"
          )}>
          <div className="fb-flex fb-h-6 fb-justify-end fb-pr-2 fb-pt-2">
            {getShowLanguageSwitch(offset) && (
              <LanguageSwitch
                surveyLanguages={localSurvey.languages}
                setSelectedLanguageCode={setselectedLanguage}
              />
            )}
            {getShowSurveyCloseButton(offset) && <SurveyCloseButton onClose={onClose} />}
          </div>
          <div
            ref={contentRef}
            className={cn(
              loadingElement ? "fb-animate-pulse fb-opacity-60" : "",
              fullSizeCards ? "" : "fb-my-auto"
            )}>
            {content()}
          </div>
          <div className="fb-mx-6 fb-mb-10 fb-mt-2 fb-space-y-3 md:fb-mb-6 md:fb-mt-6">
            {isBrandingEnabled && <FormbricksBranding />}
            {showProgressBar && <ProgressBar survey={localSurvey} questionId={questionId} />}
          </div>
        </div>
      </AutoCloseWrapper>
    );
  };

  return (
    <>
      <StackedCardsContainer
        cardArrangement={cardArrangement}
        currentQuestionId={questionId}
        getCardContent={getCardContent}
        survey={localSurvey}
        styling={styling}
        setQuestionId={setQuestionId}
        shouldResetQuestionId={shouldResetQuestionId}
        fullSizeCards={fullSizeCards}
      />
    </>
  );
};
