"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loading3DIcon } from "../../components/Loading3DIcon";

type Cliente = {
	uid: string;
	email: string | null;
	displayName: string | null;
	phoneNumber: string | null;
	totalOrdenes: number;
	pedidosAprobados: number;
	disabled: boolean | null;
	createdAt: string | null;
	lastLoginAt: string | null;
};

export default function ClientesAdminPage() {
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		async function fetchClientes() {
			try {
				setLoading(true);
				const res = await fetch("/api/admin/clientes");
				if (!res.ok) {
					console.error("Error al cargar clientes", await res.text());
					setClientes([]);
				} else {
					const data = await res.json();
					setClientes(data.clientes || []);
				}
			} catch (e) {
				console.error("Error al cargar clientes", e);
				setClientes([]);
			} finally {
				setLoading(false);
			}
		}
		fetchClientes();
	}, []);

	const clientesFiltrados = useMemo(() => {
		const term = search.trim().toLowerCase();
		const base = [...clientes];
		if (!term) {
			return base.sort((a, b) => b.pedidosAprobados - a.pedidosAprobados);
		}
		return base
			.filter((c) => {
				const email = c.email || "";
				const name = c.displayName || "";
				const phone = c.phoneNumber || "";
				return (
					email.toLowerCase().includes(term) ||
					name.toLowerCase().includes(term) ||
					phone.toLowerCase().includes(term) ||
					c.uid.toLowerCase().includes(term)
				);
			})
			.sort((a, b) => b.pedidosAprobados - a.pedidosAprobados);
	}, [clientes, search]);

	return (
		<div className="min-h-screen flex flex-col bg-white dark:bg-[#3a1859] text-slate-900 dark:text-white py-6 sm:py-12">
			<h1 className="text-3xl font-bold mb-4">Clientes</h1>
			<p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-2xl">
				Inventario de clientes que han generado órdenes. La columna de pedidos aprobados indica cuántas órdenes
				de este cliente han sido marcadas como aprobadas.
			</p>
			<div className="flex flex-wrap items-center gap-4 mb-4">
				<input
					type="text"
					placeholder="Buscar por nombre, email, teléfono o UID..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[260px]"
				/>
			</div>
			{loading ? (
				<div className="flex flex-col items-center justify-center py-24">
				  <Loading3DIcon type="user" />
				</div>
			) : clientesFiltrados.length === 0 ? (
				<div>No se encontraron clientes para este filtro.</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-50 dark:bg-slate-900/60">
							<tr>
								<th className="px-4 py-2 text-left font-semibold">Cliente</th>
								<th className="px-4 py-2 text-left font-semibold">Email</th>
								<th className="px-4 py-2 text-left font-semibold">Teléfono</th>
								<th className="px-4 py-2 text-center font-semibold">Pedidos aprobados</th>
								<th className="px-4 py-2 text-center font-semibold">Total órdenes</th>
							</tr>
						</thead>
						<tbody>
							{clientesFiltrados.map((c) => (
								<tr key={c.uid} className="border-t border-slate-100 dark:border-slate-700">
									<td className="px-4 py-2 align-top">
										<div className="font-semibold">{c.displayName || "(sin nombre)"}</div>
										<div className="text-[11px] text-slate-400 break-all">UID: {c.uid}</div>
										{c.disabled && (
											<div className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
												Deshabilitado
											</div>
										)}
									</td>
									<td className="px-4 py-2 align-top">{c.email || "-"}</td>
									<td className="px-4 py-2 align-top">{c.phoneNumber || "-"}</td>
									<td className="px-4 py-2 text-center align-top font-bold text-purple-700 dark:text-purple-300">
										{c.pedidosAprobados}
									</td>
									<td className="px-4 py-2 text-center align-top">{c.totalOrdenes}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}


