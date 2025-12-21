document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('buy-btn')) {
        const itemId = e.target.dataset.item;
        e.target.disabled = true;
        e.target.innerText = 'Comprando...';
        try {
            const resp = await fetch('/api/tienda/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId })
            });
            const data = await resp.json();
            if (!data.ok) return alert('Error: ' + (data.error || 'unknown'));
            alert('Compra realizada. Nuevo saldo: ' + data.newBalance);
            window.location.reload();
        } catch (err) {
            alert('Error al comprar');
            console.error(err);
        } finally {
            e.target.disabled = false;
            e.target.innerText = 'Comprar';
        }
    }
});
