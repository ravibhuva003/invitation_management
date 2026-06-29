import React, { useState } from "react";
import InvitationForm from "./InvitationForm";
import InvitationReport from "./InvitationReport";
import { Plus, List } from "lucide-react";

export default function InvitationManagement({
  activeView,
  setActiveView,
  setHeaderTitle,
  entries,
  villages,
  invitationNames,
  onAddVillage,
  onSaveInvitation,
  onDeleteEntry,
  googleSheetsViewUrl
}) {
  const [editingEntry, setEditingEntry] = useState(null);

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setActiveView("invitationForm");
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setActiveView("invitationReport");
  };

  const handleSaveWrapper = async (data, isNew) => {
    await onSaveInvitation(data, isNew, editingEntry?.id);
    if (editingEntry) {
      setEditingEntry(null);
      setActiveView("invitationReport");
    }
  };

  return (
    <div style={{ padding: '0 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {activeView === "invitationForm" ? (
        <InvitationForm 
          entries={entries}
          villages={villages}
          onAddVillage={onAddVillage}
          onSaveInvitation={handleSaveWrapper}
          editEntry={editingEntry}
          onCancelEdit={handleCancelEdit}
          invitationNames={invitationNames}
          onViewData={() => { setActiveView("invitationReport"); setEditingEntry(null); }}
        />
      ) : (
        <InvitationReport 
          entries={entries}
          onEditEntry={handleEditEntry}
          onDeleteEntry={onDeleteEntry}
          googleSheetsViewUrl={googleSheetsViewUrl}
          setHeaderTitle={setHeaderTitle}
        />
      )}
    </div>
  );
}
