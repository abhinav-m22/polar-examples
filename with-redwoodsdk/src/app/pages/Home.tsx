import { polar } from '@/polar'

async function getProducts() {
  try {
    const products = await polar.products.list({ isArchived: false })
    return products.result.items
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
}

export const Home = async () => {
  const products = await getProducts()
  return (
    <main>
      <form action="/api/portal" method="get">
        <input required type="email" name="email" placeholder="Enter your email" />
        <button type="submit">Open Customer Portal</button>
      </form>
      {products.length === 0 ? (
        <p>
          No products found.
        </p>
      ) : (
        <>
          {products.map((product) => (
            <a key={product.id} style={{ display: 'block' }} href={`/api/checkout?product=${product.id}`}>
              {product.name}
            </a>
          ))}
        </>
      )}
    </main>
  )
}
