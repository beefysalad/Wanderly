import React from "react";
interface IQuickJoinModalProps {
  onClose: () => void;
  onJoin: (code: string, guestName: string) => void;
}
const QuickJoinModal = ({ onClose, onJoin }: IQuickJoinModalProps) => {
  return <div>QuickJoinModal</div>;
};

export default QuickJoinModal;
