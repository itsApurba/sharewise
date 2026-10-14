import { Button, Dialog, HStack, IconButton, Menu, Portal, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuEllipsis, LuPencil, LuTrash2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { errorMessage } from "../../api/client";
import { useDeleteLesson } from "../../hooks/useLessons";
import LessonCard from "../ds/LessonCard";
import { toaster } from "../ui/toaster";
import useRememberToggle from "./useRememberToggle";

/** Edit / delete menu for the lesson's author, with a delete confirmation. */
export const LessonAuthorMenu = ({ lesson, onDeleted }) => {
  const navigate = useNavigate();
  const deleteLesson = useDeleteLesson();
  const [confirming, setConfirming] = useState(false);

  const remove = () =>
    deleteLesson.mutate(lesson.id, {
      onSuccess: () => {
        setConfirming(false);
        toaster.success({ title: "Lesson deleted" });
        onDeleted?.();
      },
      onError: (error) => toaster.error({ title: "Could not delete the lesson", description: errorMessage(error) }),
    });

  return (
    <>
      <Menu.Root positioning={{ placement: "bottom-end" }}>
        <Menu.Trigger asChild>
          <IconButton variant='ghost' colorPalette='gray' size='sm' rounded='full' aria-label='Lesson actions' mt='-1' me='-2'>
            <LuEllipsis />
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW='40'>
              <Menu.Item value='edit' onSelect={() => navigate(`/lesson/${lesson.id}/edit`)}>
                <LuPencil />
                Edit
              </Menu.Item>
              <Menu.Item value='delete' color='fg.error' _hover={{ bg: "bg.error", color: "fg.error" }} onSelect={() => setConfirming(true)}>
                <LuTrash2 />
                Delete
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <Dialog.Root open={confirming} onOpenChange={(e) => setConfirming(e.open)} role='alertdialog' placement='center' size={{ base: "xs", sm: "sm" }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner px='4'>
            <Dialog.Content rounded='card'>
              <Dialog.Header>
                <Dialog.Title fontFamily='heading'>Delete this lesson?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text color='fg.muted'>
                  “{lesson.title}” disappears for everyone
                  {lesson.rememberCount > 0 &&
                    `, including the ${lesson.rememberCount} ${lesson.rememberCount === 1 ? "person" : "people"} remembering it`}
                  . This cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant='ghost' colorPalette='gray' rounded='full'>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button colorPalette='clay' rounded='full' onClick={remove} loading={deleteLesson.isPending}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
};

/** The author's footer: no "Remember this" on your own lesson, just the count. */
const AuthorFooter = ({ lesson }) => (
  <HStack justify='space-between' pt='1' gap='2'>
    <Text fontSize='sm' color='fg.muted'>
      Your lesson
    </Text>
    <Text fontSize='sm' color='fg.muted'>
      {lesson.rememberCount} remembering
    </Text>
  </HStack>
);

/** A LessonCard wired to the API: remember toggle, and edit/delete for the author. */
const LessonItem = ({ lesson, linkToDetail = true, onDeleted }) => {
  const { remembered, toggle, busy } = useRememberToggle(lesson);
  const isAuthor = Boolean(lesson.viewer?.isAuthor);
  return (
    <LessonCard
      lesson={lesson}
      to={linkToDetail ? `/lesson/${lesson.id}` : undefined}
      remembered={remembered}
      rememberBusy={busy}
      onRemember={toggle}
      footer={isAuthor ? <AuthorFooter lesson={lesson} /> : undefined}
      headerAction={isAuthor ? <LessonAuthorMenu lesson={lesson} onDeleted={onDeleted} /> : undefined}
    />
  );
};

export default LessonItem;
