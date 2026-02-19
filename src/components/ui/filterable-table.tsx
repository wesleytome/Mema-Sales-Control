// Componente de tabela com filtros e seleção de colunas
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Search, Columns, X, LayoutGrid, List } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FilterableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  filterable?: boolean;
  filterType?: 'text' | 'select';
  filterOptions?: { label: string; value: string }[];
  defaultVisible?: boolean;
}

interface FilterableTableProps<T> {
  data: T[];
  columns: FilterableColumn<T>[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  mobileCardTitle?: (row: T) => ReactNode;
  mobileCardSubtitle?: (row: T) => ReactNode;
  searchPlaceholder?: string;
}

export function FilterableTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Nenhum item encontrado',
  actions,
  mobileCardTitle,
  mobileCardSubtitle,
  searchPlaceholder = 'Buscar...',
}: FilterableTableProps<T>) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    columns.filter((col) => col.defaultVisible !== false).map((col) => col.id)
  );
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Colunas visíveis
  const visibleColumnsList = useMemo(
    () => columns.filter((col) => visibleColumns.includes(col.id)),
    [columns, visibleColumns]
  );

  // Filtrar dados
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Filtro de busca geral
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = visibleColumnsList.some((col) => {
          const value =
            typeof col.accessor === 'function'
              ? String(col.accessor(row))
              : String(row[col.accessor] || '');
          return value.toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Filtros específicos por coluna
      for (const [columnId, filterValue] of Object.entries(filters)) {
        if (!filterValue || filterValue === 'all') continue;
        const column = columns.find((col) => col.id === columnId);
        if (!column || !column.filterable) continue;

        if (column.filterType === 'select') {
          // Para filtros de select, comparar com o valor original da propriedade
          // O columnId deve corresponder ao nome da propriedade no objeto
          const originalValue = row[columnId as keyof T];
          if (String(originalValue) !== filterValue) return false;
        } else {
          const value =
            typeof column.accessor === 'function'
              ? String(column.accessor(row))
              : String(row[column.accessor] || '');
          if (!value.toLowerCase().includes(filterValue.toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, filters, columns, visibleColumnsList]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some((v) => v);

  if (isMobile) {
    if (filteredData.length === 0) {
      return (
        <div className="space-y-4 px-1">
          {/* Busca e controles mobile */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 text-base"
              />
            </div>

            {/* Filtros e toggle mobile */}
            <div className="flex gap-2 items-center flex-wrap">
              {/* Filtros mobile */}
              {columns.some((col) => col.filterable && col.filterType === 'select') && (
                <>
                  {columns
                    .filter((col) => col.filterable && col.filterType === 'select')
                    .map((column) => (
                      <Select
                        key={column.id}
                        value={filters[column.id] || 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setFilters((prev) => {
                              const newFilters = { ...prev };
                              delete newFilters[column.id];
                              return newFilters;
                            });
                          } else {
                            setFilters((prev) => ({
                              ...prev,
                              [column.id]: value,
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 min-w-[120px]">
                          <SelectValue placeholder={`Filtrar ${column.header}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {column.filterOptions?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                </>
              )}

              {/* Toggle de visualização mobile */}
              <div className="flex items-center border rounded-md ml-auto">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="rounded-r-none border-r h-9"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full h-10"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="text-center text-muted-foreground py-12 px-4">{emptyMessage}</div>
        </div>
      );
    }

    return (
      <div className="space-y-4 px-1">
        {/* Busca e controles mobile */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 text-base"
            />
          </div>

          {/* Filtros e toggle mobile */}
          <div className="flex gap-2 items-center flex-wrap">
            {/* Filtros mobile */}
            {columns.some((col) => col.filterable && col.filterType === 'select') && (
              <>
                {columns
                  .filter((col) => col.filterable && col.filterType === 'select')
                  .map((column) => (
                    <Select
                      key={column.id}
                      value={filters[column.id] || 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setFilters((prev) => {
                            const newFilters = { ...prev };
                            delete newFilters[column.id];
                            return newFilters;
                          });
                        } else {
                          setFilters((prev) => ({
                            ...prev,
                            [column.id]: value,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 min-w-[120px]">
                        <SelectValue placeholder={`Filtrar ${column.header}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {column.filterOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
              </>
            )}

            {/* Toggle de visualização mobile */}
            <div className="flex items-center border rounded-md ml-auto">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none border-r h-9"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none h-9"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full h-10"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Visualização mobile */}
        {viewMode === 'card' ? (
          /* Cards mobile - layout compacto */
          <div className="space-y-2 pb-2">
            {filteredData.map((row) => (
              <div
                key={keyExtractor(row)}
                className="border border-border/70 rounded-2xl p-4 bg-card elevation-1 hover-lift"
              >
                <div className="space-y-2">
                  {mobileCardTitle && (
                    <div className="font-semibold text-base text-foreground">
                      {mobileCardTitle(row)}
                    </div>
                  )}
                  {mobileCardSubtitle && (
                    <div className="text-sm text-muted-foreground">
                      {mobileCardSubtitle(row)}
                    </div>
                  )}
                  <div className="pt-2 space-y-1.5">
                    {visibleColumnsList
                      .filter((column) => {
                        // Filtrar coluna "name" no mobile card já que está no título
                        if (column.id === 'name' && mobileCardTitle) {
                          return false;
                        }
                        const value =
                          typeof column.accessor === 'function'
                            ? column.accessor(row)
                            : row[column.accessor];
                        return value !== null && value !== undefined && value !== '-';
                      })
                      .map((column, index) => {
                        const value =
                          typeof column.accessor === 'function'
                            ? column.accessor(row)
                            : row[column.accessor];

                        return (
                          <div key={index} className="flex justify-between items-start gap-2">
                            <span className="text-xs font-medium text-muted-foreground/80">
                              {column.header}:
                            </span>
                            <span className="text-sm text-foreground text-right flex-1">
                              {value}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  {actions && (
                    <div className="pt-3 mt-2 border-t border-gray-200 flex justify-end gap-2">
                      {actions(row)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Lista mobile - tabela */
          filteredData.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">{emptyMessage}</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumnsList.map((column) => (
                      <TableHead key={column.id} className={column.className}>
                        {column.header}
                      </TableHead>
                    ))}
                    {actions && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow key={keyExtractor(row)}>
                      {visibleColumnsList.map((column) => {
                        const value =
                          typeof column.accessor === 'function'
                            ? column.accessor(row)
                            : row[column.accessor];

                        return (
                          <TableCell key={column.id} className={column.className}>
                            {value}
                          </TableCell>
                        );
                      })}
                      {actions && (
                        <TableCell className="text-right">{actions(row)}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca, filtros e controles desktop */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtros ao lado da busca */}
          {columns.some((col) => col.filterable && col.filterType === 'select') && (
            <>
              {columns
                .filter((col) => col.filterable && col.filterType === 'select')
                .map((column) => (
                  <Select
                    key={column.id}
                    value={filters[column.id] || 'all'}
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setFilters((prev) => {
                          const newFilters = { ...prev };
                          delete newFilters[column.id];
                          return newFilters;
                        });
                      } else {
                        setFilters((prev) => ({
                          ...prev,
                          [column.id]: value,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={`Filtrar ${column.header}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {column.filterOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
            </>
          )}

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {/* Toggle de visualização */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-r-none border-r"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Visualização em Card */}
      {viewMode === 'card' ? (
        filteredData.length === 0 ? (
          <div className="text-center text-gray-500 py-12">{emptyMessage}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((row) => (
              <Card key={keyExtractor(row)} className="overflow-hidden shadow-sm border-gray-200">
                <CardHeader className="pb-3 px-4 pt-4 space-y-1">
                  {mobileCardTitle && (
                    <CardTitle className="text-lg font-semibold leading-tight text-gray-900">
                      {mobileCardTitle(row)}
                    </CardTitle>
                  )}
                  {mobileCardSubtitle && (
                    <CardDescription className="text-sm text-gray-600 leading-relaxed">
                      {mobileCardSubtitle(row)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {visibleColumnsList
                    .filter((column) => {
                      const value =
                        typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : row[column.accessor];
                      return value !== null && value !== undefined && value !== '-';
                    })
                    .map((column, index) => {
                      const value =
                        typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : row[column.accessor];

                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {column.header}
                          </span>
                          <span className="text-sm text-gray-900 font-medium break-words">
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  {actions && (
                    <div className="pt-3 mt-2 border-t border-gray-200 flex justify-end gap-2">
                      {actions(row)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Tabela desktop */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumnsList.map((column) => (
                  <TableHead key={column.id} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                {actions && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnsList.length + (actions ? 1 : 0)}
                    className="text-center text-gray-500"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => (
                  <TableRow key={keyExtractor(row)}>
                    {visibleColumnsList.map((column) => {
                      const value =
                        typeof column.accessor === 'function'
                          ? column.accessor(row)
                          : row[column.accessor];

                      return (
                        <TableCell key={column.id} className={column.className}>
                          {value}
                        </TableCell>
                      );
                    })}
                    {actions && (
                      <TableCell className="text-right">{actions(row)}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

