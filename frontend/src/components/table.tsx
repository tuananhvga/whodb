import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { CSSProperties, FC, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cell, Row, useBlockLayout, useTable } from 'react-table';
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { twMerge } from "tailwind-merge";
import { isMarkdown, isNumeric, isValidJSON } from "../utils/functions";
import { ActionButton, AnimatedButton } from "./button";
import { Portal } from "./common";
import { CodeEditor } from "./editor";
import { useExportToCSV, useLongPress } from "./hooks";
import { Icons } from "./icons";
import { SearchInput } from "./search";

type IPaginationProps = {
    pageCount: number;
    currentPage: number;
    onPageChange?: (page: number) => void;
}

const Pagination: FC<IPaginationProps> = ({ pageCount, currentPage, onPageChange }) => {
    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        if (pageCount <= maxVisiblePages) {
            for (let i = 1; i <= pageCount; i++) {
                pageNumbers.push(
                    <div
                        key={i}
                        className={`cursor-pointer p-2 text-sm hover:scale-110 hover:bg-gray-200 rounded-md text-gray-600 ${currentPage === i ? 'bg-gray-300' : ''}`}
                        onClick={() => onPageChange?.(i)}
                    >
                        {i}
                    </div>
                );
            }
        } else {
            const createPageItem = (i: number) => (
                <div
                    key={i}
                    className={`cursor-pointer p-2 text-sm hover:scale-110 hover:bg-gray-200 rounded-md text-gray-600 ${currentPage === i ? 'bg-gray-300' : ''}`}
                    onClick={() => onPageChange?.(i)}
                >
                    {i}
                </div>
            );

            pageNumbers.push(createPageItem(1));

            if (currentPage > 3) {
                pageNumbers.push(
                    <div key="start-ellipsis" className="cursor-default p-2 text-sm text-gray-600">...</div>
                );
            }

            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(pageCount - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(createPageItem(i));
            }

            if (currentPage < pageCount - 2) {
                pageNumbers.push(
                    <div key="end-ellipsis" className="cursor-default p-2 text-sm text-gray-600">...</div>
                );
            }

            pageNumbers.push(createPageItem(pageCount));
        }

        return pageNumbers;
    };

    return (
        <div className="flex space-x-2">
            {renderPageNumbers()}
        </div>
    );
};

type ITDataProps = {
    cell: Cell<Record<string, string>>;
}

const TData: FC<ITDataProps> = ({ cell }) => {
    const [changed, setChanged] = useState(false);
    const [editedData, setEditedData] = useState<string>(cell.value);
    const ref = useRef<HTMLTableCellElement>(null);
    const [editable, setEditable] = useState(false);
    const [preview, setPreview] = useState(false);
    const [cellRect, setCellRect] = useState<DOMRect | null>(null);
    const cellRef = useRef<HTMLDivElement>(null);

    const handleChange = useCallback((value: string) => {
        setEditedData(value);
        if (!changed) setChanged(true);
    }, [changed]);
    
    const handleCancel = useCallback(() => {
        setEditedData(cell.value);
        setEditable(false);
        setCellRect(null);
    }, [cell]);

    const handleEdit = useCallback(() => {
        if (cellRef.current) {
            setCellRect(cellRef.current.getBoundingClientRect());
            setEditable(true);
        }
    }, []);

    const handlePreview = useCallback(() => {
        if (cellRef.current) {
            setCellRect(cellRef.current.getBoundingClientRect());
            setPreview(true);
        }
    }, []);

    const handleLongPress = useCallback(() => {
        handlePreview();
        return () => {
            setCellRect(null);
            setPreview(false);
        }
    }, [handlePreview]);

    const longPressProps = useLongPress({
        onLongPress: handleLongPress,
    });

    const handleUpdate = useCallback(() => {
        console.log("Update", cell.value, ref.current?.innerText);
    }, [cell]);

    const language = useMemo(() => {
        if (isValidJSON(editedData)) {
            return "json";
        }
        if (isMarkdown(editedData)) {
            return "markdown";
        }
    }, [editedData]);

    return <div ref={cellRef} {...cell.getCellProps()}
        className={classNames("relative group/data cursor-pointer transition-all text-xs table-cell border-t border-l last:border-r group-last/row:border-b group-last/row:first:rounded-bl-lg group-last/row:last:rounded-br-lg border-gray-200 p-0", {
            "bg-gray-200 blur-[2px]": editable || preview,
        })}
        {...longPressProps}
    >
        <span className="hidden">{editedData}</span>
        <div 
            className={classNames("w-full h-full p-2 leading-tight focus:outline-none focus:shadow-outline appearance-none transition-all duration-300 border-solid border-gray-200 overflow-hidden whitespace-nowrap", {
                "group-even/row:bg-gray-100 hover:bg-gray-300 group-even/row:hover:bg-gray-300": !editable,
                "bg-transparent": editable,
            })}
        >{editedData}</div>
        {editable && (
            <div className="transition-all hidden group-hover/data:flex absolute right-8 top-1/2 -translate-y-1/2 hover:scale-125" onClick={handleCancel}>
                {Icons.Cancel}
            </div>
        )}
        <div className="transition-all hidden group-hover/data:flex absolute right-2 top-1/2 -translate-y-1/2 hover:scale-125" onClick={editable ? handleUpdate : handleEdit}>
            {editable ? Icons.CheckCircle : Icons.Edit}
        </div>

        <AnimatePresence>
            {cellRect != null && (
                <Portal>
                    <motion.div
                        initial={{ opacity: 0, }}
                        animate={{ opacity: 1, }}
                        exit={{ opacity: 0, }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-50 bg-gray-500/40">
                        <motion.div
                            initial={{
                                top: cellRect.top,
                                left: cellRect.left,
                                width: cellRect.width,
                                height: cellRect.height,
                                transform: "unset",
                            }}
                            animate={{
                                top: "35vh",
                                left: "25vw",
                                height: '30vh',
                                width: '50vw',
                            }}
                            exit={{
                                top: cellRect.top,
                                left: cellRect.left,
                                width: cellRect.width,
                                height: cellRect.height,
                                transform: "unset",
                            }}
                            transition={{ duration: 0.4 }}
                            className="absolute flex flex-col h-full justify-between gap-4">
                            <div className="rounded-lg shadow-lg overflow-hidden grow">
                                <CodeEditor
                                    defaultShowPreview={preview}
                                    disabled={preview}
                                    language={language}
                                    value={editedData}
                                    setValue={handleChange}
                                />
                            </div>
                            <div className={classNames("flex gap-2 justify-center w-full", {
                                "hidden": preview,
                            })}>
                                <ActionButton icon={Icons.Cancel} onClick={handleCancel} />
                                <ActionButton icon={Icons.CheckCircle} className={changed ? "stroke-green-500" : undefined} onClick={handleUpdate} disabled={changed} />
                            </div>
                        </motion.div>
                    </motion.div>
                </Portal>
            )}
        </AnimatePresence>
    </div>
}

type ITableRow = {
    rowIndex: number;
    row: Row<Record<string, string>>;
    style: CSSProperties;
}

const TableRow: FC<ITableRow> = ({ rowIndex, row, style }) => {
    return (
        <div className="table-row-group text-xs group/row" {...row.getRowProps({ style })}>
            {
                row.cells.map((cell) => (
                    <TData key={cell.getCellProps().key} cell={cell} />
                ))
            }
        </div>
    )
}

type ITableProps = {
    className?: string;
    columns: string[];
    columnTags?: string[];
    rows: string[][];
    totalPages: number;
    currentPage: number;
    onPageChange?: (page: number) => void;
}

export const Table: FC<ITableProps> = ({ className, columns: actualColumns, rows: actualRows, columnTags, totalPages, currentPage, onPageChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const [direction, setDirection] = useState<"asc" | "dsc">();
    const [sortedColumn, setSortedColumn] = useState<string>();
    const [search, setSearch] = useState("");
    const [searchIndex, setSearchIndex] = useState(0);
    const [width, setWidth] = useState(0);

    const defaultColumn = useMemo(() => ({
        maxWidth: 150,
    }), []);

    const columns = useMemo(() => {
        const cols = actualColumns.map(col => ({
            id: col,
            Header: col,
            accessor: col,
        }));
        cols.unshift({
            id: "#",
            Header: "#",
            accessor: "#",
        });
        return cols;
    }, [actualColumns]);

    const data = useMemo(() => {
        return actualRows.map((row, rowIndex) => {
            return row.reduce((all, one, colIndex) => {
                all[actualColumns[colIndex]] = one;
                return all;
            }, { "#": (rowIndex+1).toString() } as Record<string, string>);
        });
    }, [actualColumns, actualRows]);

    const sortedRows = useMemo(() => {
        if (!sortedColumn) {
            return data;
        }
        const newRows = [...data];
        newRows.sort((a, b) => {
            const aValue = a[sortedColumn];
            const bValue = b[sortedColumn];
            if (isNumeric(aValue) && isNumeric(bValue)) {
                const aValueNumber = Number.parseFloat(aValue);
                const bValueNumber = Number.parseFloat(bValue);
                return direction === 'asc' ? aValueNumber - bValueNumber : bValueNumber - aValueNumber;
            }

            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return newRows;
    }, [sortedColumn, direction, data]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable(
        {
            columns,
            data: sortedRows,
            defaultColumn,
        },
        useBlockLayout,
    );

    const rowCount = useMemo(() => {
        return rows.length ?? 0;
    }, [rows]);

    const handleKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (tableRef.current == null) {
            return;
        }
        let interval: NodeJS.Timeout;
        if (e.key === "Enter") {
            let newSearchIndex = (searchIndex + 1) % rowCount;
            setSearchIndex(newSearchIndex);
            const searchText = search.toLowerCase();
            let index = 0;
            const tbody = tableRef.current.querySelector(".tbody");
            if (tbody == null) {
                return;
            }
            for (const childNode of tbody.childNodes) {
                if (childNode instanceof HTMLTableRowElement) {
                    const text = childNode.textContent?.toLowerCase();
                    if (text != null && searchText != null && text.includes(searchText)) {
                        if (index === newSearchIndex) {
                            childNode.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                                inline: "center",
                            });
                            for (const cell of childNode.querySelectorAll("input")) {
                                if (cell instanceof HTMLInputElement) {
                                    cell.classList.add("!bg-yellow-100");
                                    interval = setTimeout(() => {
                                        cell.classList.remove("!bg-yellow-100");
                                    }, 3000);
                                }
                            }
                            return;
                        }
                        index++;
                    }
                }
            };
        }

        return () => {
            if (interval != null) {
                clearInterval(interval);
            }
        }
    }, [search, rowCount, searchIndex]);

    const handleSearchChange = useCallback((newValue: string) => {
        setSearchIndex(-1);
        setSearch(newValue);
    }, []);

    const handleSort = useCallback((columnToSort: string) => {
        const columnSelectedIsDifferent = columnToSort !== sortedColumn;
        if (!columnSelectedIsDifferent && direction === "dsc") {
            setDirection(undefined);
            return setSortedColumn(undefined);
        }
        setSortedColumn(columnToSort);
        if (direction == null || columnSelectedIsDifferent) {
            return setDirection("asc");
        }
        setDirection("dsc");
    }, [sortedColumn, direction]);

    const handleRenderRow = useCallback(({ index, style }: ListChildComponentProps) => {
        const row = rows[index];
        prepareRow(row);
        return <TableRow key={`row-${row.values[actualColumns[0]]}`} row={row} rowIndex={index} style={style} />;
    }, [rows, prepareRow, actualColumns]);

    useEffect(() => {
        if (containerRef.current == null) {
            return;
        }
        setWidth(containerRef.current.getBoundingClientRect().width);
    }, []);

    const exportToCSV = useExportToCSV(actualColumns, sortedRows);

    return (
        <div className="flex flex-col grow gap-4 items-center w-full" ref={containerRef}>
            <div className="flex justify-between items-center w-full">
                <div>
                    <SearchInput search={search} setSearch={handleSearchChange} placeholder="Search through rows     [Press Enter]" inputProps={{
                        className: "w-[300px]",
                        onKeyUp: handleKeyUp,
                    }} />
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-sm text-gray-600"><span className="font-semibold">Count:</span> {rowCount}</div>
                    <AnimatedButton icon={Icons.Download} label="Export" type="lg" onClick={exportToCSV} />
                </div>
            </div>
            <div className={twMerge(classNames("flex h-[60vh] flex-col gap-4 overflow-x-auto", className))} style={{
                width,
            }}>
                <div className="table border-separate border-spacing-0 mt-4 h-fit" ref={tableRef} {...getTableProps()}>
                    <div>
                        {headerGroups.map(headerGroup => (
                            <div {...headerGroup.getHeaderGroupProps()} className="table-header-group">
                                {headerGroup.headers.map((column, i) => (
                                    <div className="text-xs border-t border-l last:border-r border-gray-200 p-2 text-left bg-gray-500 text-white first:rounded-tl-lg last:rounded-tr-lg relative group/header cursor-pointer select-none"
                                        onClick={() => handleSort(column.id)} {...column.getHeaderProps()}>
                                        {column.render('Header')} {i > 0 && <span className="text-[11px]">[{columnTags?.[i-1]}]</span>}
                                        <div className={twMerge(classNames("transition-all absolute top-2 right-2 opacity-0", {
                                            "opacity-100": sortedColumn === column.id,
                                            "rotate-180": direction === "dsc",
                                        }))}>
                                            {Icons.ArrowUp}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="tbody" {...getTableBodyProps()}>
                        <FixedSizeList
                            height={window.innerHeight * 0.6 - 100}
                            itemCount={sortedRows.length}
                            itemSize={31}
                            width="100%"
                        >
                            {handleRenderRow}
                        </FixedSizeList>
                    </div>
                </div>
            </div>
            <div className="flex justify-center items-center">
                <Pagination pageCount={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
            </div>
        </div>
    )
}
