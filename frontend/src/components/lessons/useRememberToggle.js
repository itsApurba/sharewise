import { useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../../api/client";
import { useMe } from "../../hooks/useAuth";
import { useRemember, useUnremember } from "../../hooks/useLessons";
import { toaster } from "../ui/toaster";

/** "Remember this" toggle state and handler for one lesson. Logged-out readers go to log in. */
const useRememberToggle = (lesson) => {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const remember = useRemember();
  const unremember = useUnremember();
  const remembered = Boolean(lesson.viewer?.remembered);

  const toggle = () => {
    if (!me) {
      toaster.info({ title: "Log in to remember lessons", description: "Saved lessons come back for review right before you would forget them." });
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (remembered) {
      unremember.mutate(lesson.id, {
        onSuccess: () => toaster.info({ title: "Stopped remembering", description: "It will not come back for review." }),
        onError: (error) => toaster.error({ title: "Could not update", description: errorMessage(error) }),
      });
    } else {
      remember.mutate(lesson.id, {
        onSuccess: () => toaster.success({ title: "Saved to remember", description: "It comes back for a quick review tomorrow." }),
        onError: (error) => toaster.error({ title: "Could not save", description: errorMessage(error) }),
      });
    }
  };

  return { remembered, toggle, busy: remember.isPending || unremember.isPending };
};

export default useRememberToggle;
