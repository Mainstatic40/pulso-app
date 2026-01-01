import { Modal } from '../ui/Modal';
import { UserForm } from './UserForm';
import type { User } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function UserModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading,
}: UserModalProps) {
  const title = user ? 'Editar usuario' : 'Nuevo usuario';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <UserForm
        user={user}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}