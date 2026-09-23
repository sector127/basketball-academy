"use client"

import React, {useState} from "react"
import {
    flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input";
import {DropdownMenu} from "@/components/ui/dropdown-menu";
import {DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {IoOptions} from "react-icons/io5";
import {useRouter} from "next/navigation";
import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import {FaUserPlus} from "react-icons/fa6";
import {Plus} from "lucide-react";

export function DataTable({columns, data, onDataChange, context}) {
    const [columnFilters, setColumnFilters] = useState([])
    const [columnVisibility, setColumnVisibility] = useState({})
    const [rowSelection, setRowSelection] = useState({})
    const [openDialog, setOpenDialog] = useState(false)

    const router = useRouter()

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const handleOnRowClick = (row) => {
        const playerId = row.original._id
        router.push(`/dashboard/admin/players/${playerId}`)
    }

    const handleAdd = () => {
        router.push(`/dashboard/admin/players/create`)
    }

    const handleDisableMany = async () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original._id)
        try {
            const response = await fetch('/api/admin/players/disable', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({playerIds: selectedRows})
            })
            if (!response.ok) {
                throw new Error('Failed to disable players')
            }

            // Reset selection
            table.resetRowSelection()
            setOpenDialog(false)

            // Trigger data refetch in parent component
            if (onDataChange) {
                await onDataChange()
            }
        } catch (error) {
            console.error('Error disabling players:', error)
        }
    }

    const handleOpenDialog = (e) => {
        e.stopPropagation();
        setOpenDialog(true);
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setOpenDialog(false)
    }

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Filter by Name..."
                    value={(table.getColumn("fullName")?.getFilterValue()) ?? ""}
                    onChange={(event) =>
                        table.getColumn("fullName")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <span className='flex space-x-2'>
                {context === 'players' && (<Button
                    variant='default'
                    // className="bg-gradient-to-r from-amber-500 to-orange-500 transition-all ease-in-out duration-300 transform hover:from-amber-600 hover:to-orange-600"
                    onClick={handleAdd}><Plus className="mr-2 h-4 w-4"/>Add Player</Button>)}
                    {context === 'players' && (<DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <IoOptions className='mr-2'/>
                                View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id.split('_')[0]}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>)}
                </span>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => handleOnRowClick(row)}
                                    className="cursor-pointer"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length > 0 && (
                            <Button variant='destructive' onClick={handleOpenDialog}>
                                Disable {' '}
                                {table.getFilteredSelectedRowModel().rows.length}
                            </Button>
                        )}

                        <Dialog open={openDialog}
                                onClose={(e, reason) => {
                                    e.stopPropagation();
                                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                                        return;
                                    }
                                    handleCancel();
                                }}
                                disableEscapeKeyDown
                        >
                            <DialogTitle>Confirm Disable</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Disabling selected player(s) cannot be undone. Are you sure you want to proceed?
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCancel} variant='outline'>Cancel</Button>
                                <Button onClick={handleDisableMany} variant='destructive'>
                                    Disable
                                </Button>
                            </DialogActions>
                        </Dialog>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DataTable;