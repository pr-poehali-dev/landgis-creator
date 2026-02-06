import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import AdminNavigation from '@/components/admin/AdminNavigation';
import FilterColumnItem from '@/components/admin/filter-settings/FilterColumnItem';
import FilterPreviewTable from '@/components/admin/filter-settings/FilterPreviewTable';
import EditColumnDialog from '@/components/admin/filter-settings/EditColumnDialog';
import CreateColumnDialog from '@/components/admin/filter-settings/CreateColumnDialog';
import FilterSettingsHeader from '@/pages/admin-filter/FilterSettingsHeader';
import { useFilterSettingsLogic } from '@/pages/admin-filter/useFilterSettingsLogic';
import { getOptionLabel } from '@/pages/admin-filter/filterLabels';

const AdminFilterSettings = () => {
  const {
    filterColumns,
    draggedColumn,
    editingColumn,
    isEditDialogOpen,
    isCreateDialogOpen,
    isSaving,
    availableAttributes,
    newColumn,
    setEditingColumn,
    setIsEditDialogOpen,
    setIsCreateDialogOpen,
    setNewColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    toggleColumn,
    openEditDialog,
    handleSaveEdit,
    moveOption,
    toggleDefaultValue,
    handleSaveSettings,
    handleResetSettings,
    handleDeleteColumn,
    openCreateDialog,
    handleCreateColumn
  } = useFilterSettingsLogic();

  const sortedColumns = [...filterColumns].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />

      <div className="container mx-auto px-4 lg:px-6 py-6">
        <FilterSettingsHeader
          isSaving={isSaving}
          onReset={handleResetSettings}
          onCreate={openCreateDialog}
          onSave={handleSaveSettings}
        />

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="Layers" size={20} />
                Столбцы фильтра
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Перетаскивайте для изменения порядка отображения
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedColumns.map((column) => (
                <FilterColumnItem
                  key={column.id}
                  column={column}
                  isDragging={draggedColumn === column.id}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onToggle={toggleColumn}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteColumn}
                />
              ))}
            </CardContent>
          </Card>

          <FilterPreviewTable
            columns={sortedColumns}
            getOptionLabel={getOptionLabel}
          />
        </div>
      </div>

      <EditColumnDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        column={editingColumn}
        onColumnChange={setEditingColumn}
        onSave={handleSaveEdit}
        onMoveOption={moveOption}
        onToggleDefault={toggleDefaultValue}
        getOptionLabel={getOptionLabel}
      />

      <CreateColumnDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        newColumn={newColumn}
        onColumnChange={setNewColumn}
        onCreate={handleCreateColumn}
        availableAttributes={availableAttributes}
      />
    </div>
  );
};

export default AdminFilterSettings;
