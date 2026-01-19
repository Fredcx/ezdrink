import { getImageUrl } from '@/app/utils/imageHelper';

// ...

{
    image_url ? (
        <img src={getImageUrl(image_url)!} alt={name} className="w-full h-full object-cover" />
    ) : (
        "Img"
    )
}
                </div >
    <div>
        <h4 className="font-bold text-foreground text-sm">{name}</h4>
        <span className="text-xs text-gray-500">R$ {price.toFixed(2)}</span>
    </div>
            </div >

    <div className="flex items-center gap-3">
        <button
            onClick={() => removeItem(id)}
            className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-bold w-4 text-center">{quantity}</span>
        <button
            onClick={() => addItem({ id, name, price })}
            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:brightness-90 transition-colors">
            <Plus className="w-3 h-3" />
        </button>
    </div>
        </div >
    );
}
