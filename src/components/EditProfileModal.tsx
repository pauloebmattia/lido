'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Profile } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    onProfileUpdate: (updatedProfile: Profile) => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onProfileUpdate }: EditProfileModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [displayName, setDisplayName] = useState(profile.display_name || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            let avatarUrl = profile.avatar_url;

            // 1. Upload Avatar if changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }

            // 2. Update Profile in DB
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    bio: bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                onProfileUpdate(data);
                onClose();
                router.refresh();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-paper rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                    <h2 className="font-serif text-lg font-bold text-ink">Editar Perfil</h2>
                    <button onClick={onClose} className="text-fade hover:text-ink transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-stone-100 shadow-sm relative">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
                                        <Camera size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white" size={24} />
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-xs text-fade">Clique para alterar a foto</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-ink">Nome de Exibição</label>
                            <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-ink">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Conte um pouco sobre você..."
                                className="w-full min-h-[100px] p-3 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none text-ink placeholder:text-fade"
                                maxLength={160}
                            />
                            <div className="text-xs text-right text-fade">
                                {bio.length}/160
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-4">
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </Button>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-stone-200">
                        <button
                            onClick={async () => {
                                if (confirm('Tem certeza? Essa ação não pode ser desfeita e apagará todos os seus dados.')) {
                                    setIsLoading(true);
                                    try {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (!session) return;

                                        const res = await fetch('/api/auth/delete', {
                                            method: 'DELETE',
                                            headers: {
                                                Authorization: `Bearer ${session.access_token}`
                                            }
                                        });

                                        if (res.ok) {
                                            await supabase.auth.signOut();
                                            window.location.href = '/';
                                        } else {
                                            alert('Erro ao excluir conta.');
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert('Erro ao excluir conta.');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center"
                            disabled={isLoading}
                        >
                            Excluir minha conta permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
