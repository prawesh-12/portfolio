// visitorCounter.js

// Wait for Supabase to be available
function waitForSupabase() {
    if (typeof supabase !== 'undefined') {
        const SUPABASE_URL = 'https://ijcdgazxalhlmqeufnjm.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY2RnYXp4YWxobG1xZXVmbmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjA0NjYsImV4cCI6MjA3NDAzNjQ2Nn0.7L7zZgqly6XDhACBoq-B7jcmMh0gn5wdEc3HaJ3iEBo';

        // Use the global 'supabase' from CDN
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        const countSpan = document.getElementById('visitor-count');

        function getVisitorId() {
            let visitorId = localStorage.getItem('visitorId');
            if (!visitorId) {
                visitorId = crypto.randomUUID ? crypto.randomUUID() : generateFallbackUUID();
                localStorage.setItem('visitorId', visitorId);
            }
            return visitorId;
        }

        function generateFallbackUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }

        async function trackVisitor() {
            const visitorId = getVisitorId();
            try {
                const { data, error } = await supabaseClient
                    .from('visitor_ids')
                    .select('visitor_id')
                    .eq('visitor_id', visitorId)
                    .limit(1);

                if (error) {
                    console.error('Error checking visitor:', error);
                    countSpan.textContent = 'Error loading visitor count.';
                    return;
                }

                if (data.length === 0) {
                    const { error: insertError } = await supabaseClient
                        .from('visitor_ids')
                        .insert([{ visitor_id: visitorId }]);

                    if (insertError) {
                        console.error('Error inserting visitor:', insertError);
                        countSpan.textContent = 'Error loading visitor count.';
                        return;
                    }

                    const { data: updatedData, error: updateError } = await supabaseClient
                        .rpc('increment_visitor_count');

                    if (updateError) {
                        console.error('Error incrementing counter:', updateError);
                        const { data: currentData } = await supabaseClient
                            .from('visitor_counter')
                            .select('count')
                            .eq('id', 1)
                            .single();
                        countSpan.textContent = currentData?.count || 0;
                        return;
                    }

                    countSpan.textContent = updatedData || 0;
                } else {
                    const { data: currentData } = await supabaseClient
                        .from('visitor_counter')
                        .select('count')
                        .eq('id', 1)
                        .single();
                    countSpan.textContent = currentData?.count || 0;
                }
            } catch (err) {
                console.error('Error in trackVisitor:', err);
                countSpan.textContent = 'Error loading visitor count.';
            }
        }

        // Start tracking after everything is loaded
        trackVisitor();
    } else {
        // Check again in 50ms if supabase is not yet ready
        setTimeout(waitForSupabase, 50);
    }
}

// Start checking when DOM is ready
document.addEventListener('DOMContentLoaded', waitForSupabase);