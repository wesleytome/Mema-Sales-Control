// Componente de tabela responsiva (cards em mobile, tabela em desktop)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  mobileCardTitle?: (row: T) => ReactNode;
  mobileCardSubtitle?: (row: T) => ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Nenhum item encontrado',
  actions,
  mobileCardTitle,
  mobileCardSubtitle,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    if (data.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((row) => (
          <Card key={keyExtractor(row)}>
            <CardHeader>
              {mobileCardTitle && (
                <CardTitle className="text-base">{mobileCardTitle(row)}</CardTitle>
              )}
              {mobileCardSubtitle && (
                <CardDescription>{mobileCardSubtitle(row)}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
                {columns.map((column, index) => {
                  const accessor = column.accessor;
                  const isFunctionAccessor = typeof accessor === 'function';
                  const rawValue = isFunctionAccessor
                    ? accessor(row)
                    : row[accessor as keyof T];
                  const displayValue = isFunctionAccessor
                    ? (rawValue as ReactNode)
                    : String(rawValue ?? '');
                  
                  if (!displayValue) return null;

                  return (
                    <div key={index} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600">
                        {column.header}:
                      </span>
                      <span className="text-sm text-right flex-1 ml-4">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              {actions && (
                <div className="pt-3 border-t flex justify-end gap-2">
                  {actions(row)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center text-gray-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map((column, index) => {
                  const accessor = column.accessor;
                  const isFunctionAccessor = typeof accessor === 'function';
                  const rawValue = isFunctionAccessor
                    ? accessor(row)
                    : row[accessor as keyof T];
                  const displayValue = isFunctionAccessor
                    ? (rawValue as ReactNode)
                    : String(rawValue ?? '');
                  
                  return (
                    <TableCell key={index} className={column.className}>
                      {displayValue}
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
  );
}
