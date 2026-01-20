
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'; // Force Node.js runtime for file upload compatibility

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Products List Error:", error);
        return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const price = parseFloat(formData.get('price') as string);
        const category_id = parseInt(formData.get('category_id') as string);
        const description = formData.get('description') as string;
        const imageFile = formData.get('image') as File | null;

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        let user = null;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            // Using getUser is safer for actual auth validation on server side
            const { data: u } = await supabase.auth.getUser(token);
            user = u.user;
        }

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Upload Image
        let imageUrl = null;
        if (imageFile && imageFile.name) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            // Assume 'products' bucket exists and is public, or handle error
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                return NextResponse.json({ error: `Erro no Upload: ${uploadError.message}` }, { status: 500 });
            }

            const { data: publicUrlData } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
        }

        // 3. Insert Product
        const { data: product, error: insertError } = await supabase
            .from('products')
            .insert([{
                name,
                price,
                category_id,
                description,
                image_url: imageUrl
            }])
            .select()
            .single();

        if (insertError) {
            console.error("Insert Error:", insertError);
            return NextResponse.json({ error: 'Erro ao salvar no banco de dados' }, { status: 500 });
        }

        return NextResponse.json(product);

    } catch (error: any) {
        console.error("Create Product Error:", error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
