import ModalBase from "./Modal"
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import ModalConfirmation from "./ModalConfirmation";

type ModalType = typeof ModalBase &
  {
    Body: typeof ModalBody,
    Footer: typeof ModalFooter,
    Confirmation: typeof ModalConfirmation
  }

const Modal = ModalBase as ModalType;

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Confirmation = ModalConfirmation;

export default Modal;
