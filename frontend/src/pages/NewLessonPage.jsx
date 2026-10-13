import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { LuLogIn, LuSearchX } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage } from "../api/client";
import EmptyState from "../components/ds/EmptyState";
import { LessonCardSkeleton } from "../components/ds/LessonCard";
import { PageContainer, PageHeader } from "../components/ds/Page";
import LessonComposer from "../components/lessons/LessonComposer";
import { changedFields, emptyForm, formFromLesson, toPayload } from "../components/lessons/lessonForm";
import { toaster } from "../components/ui/toaster";
import { useMe } from "../hooks/useAuth";
import { useCreateLesson, useLesson, useUpdateLesson } from "../hooks/useLessons";

/** Runs a lesson mutation and turns a 400/409 into per-field errors for the composer. */
const useSubmitter = (mutation, onSuccess) => {
  const [serverErrors, setServerErrors] = useState({});
  const submit = (payload) => {
    setServerErrors({});
    mutation.mutate(payload, {
      onSuccess,
      onError: (error) => {
        const fields = error.response?.data?.error?.fields;
        if (fields) setServerErrors(fields);
        toaster.error({ title: "Could not save the lesson", description: errorMessage(error) });
      },
    });
  };
  return { submit, serverErrors };
};

const LoginNeeded = () => (
  <EmptyState
    icon={<LuLogIn />}
    title='Log in to teach'
    description='Lessons are signed by their author. Log in or create an account to write one.'
    action={
      <Button asChild rounded='full'>
        <Link to='/login' state={{ from: "/new" }}>
          Log in
        </Link>
      </Button>
    }
  />
);

export const NewLessonPage = () => {
  const navigate = useNavigate();
  const { data: me, isPending } = useMe();
  const create = useCreateLesson();
  const { submit, serverErrors } = useSubmitter(create, (lesson) => {
    toaster.success({ title: "Lesson published", description: "It is in your followers' feeds and on Explore." });
    navigate(`/lesson/${lesson.id}`);
  });

  return (
    <PageContainer>
      <PageHeader eyebrow='Teach something' title='New lesson' description='One idea, small enough to remember.' backTo='/' backLabel='Feed' />
      {isPending ? (
        <LessonCardSkeleton />
      ) : !me ? (
        <LoginNeeded />
      ) : (
        <LessonComposer
          initial={emptyForm()}
          author={me}
          submitLabel='Publish lesson'
          submitting={create.isPending}
          serverErrors={serverErrors}
          onSubmit={(form) => submit(toPayload(form))}
        />
      )}
    </PageContainer>
  );
};

const EditForm = ({ lesson }) => {
  const navigate = useNavigate();
  const update = useUpdateLesson();
  const before = toPayload(formFromLesson(lesson));
  const back = () => navigate(`/lesson/${lesson.id}`);
  const { submit, serverErrors } = useSubmitter(update, () => {
    toaster.success({ title: "Lesson updated" });
    back();
  });

  const save = (form) => {
    const changes = changedFields(before, toPayload(form));
    if (Object.keys(changes).length === 0) {
      back();
      return;
    }
    submit({ id: lesson.id, ...changes });
  };

  return (
    <LessonComposer
      initial={formFromLesson(lesson)}
      author={lesson.author}
      submitLabel='Save changes'
      submitting={update.isPending}
      serverErrors={serverErrors}
      onSubmit={save}
      onCancel={back}
    />
  );
};

export const EditLessonPage = () => {
  const { id } = useParams();
  const { data: me, isPending: mePending } = useMe();
  const { data: lesson, isPending, isError } = useLesson(id);

  let content;
  if (mePending || (isPending && !isError)) content = <LessonCardSkeleton />;
  else if (!me) content = <LoginNeeded />;
  else if (isError || !lesson.viewer?.isAuthor) {
    content = (
      <EmptyState
        icon={<LuSearchX />}
        title={isError ? "Lesson not found" : "Only the author can edit this lesson"}
        description={isError ? "It may have been deleted, or the link is mistyped." : "You can still remember it, or write a lesson of your own."}
        action={
          <Button asChild rounded='full'>
            <Link to={isError ? "/explore" : `/lesson/${id}`}>{isError ? "Explore lessons" : "Back to the lesson"}</Link>
          </Button>
        }
      />
    );
  } else {
    content = <EditForm lesson={lesson} />;
  }

  return (
    <PageContainer>
      <PageHeader eyebrow='Your lesson' title='Edit lesson' description='Changing the quiz clears earlier answers to it.' backTo={`/lesson/${id}`} backLabel='Lesson' />
      {content}
    </PageContainer>
  );
};

export default NewLessonPage;
