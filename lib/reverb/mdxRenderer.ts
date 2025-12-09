// lib/reverb/mdxRenderer.ts

export function formatDataWithMDX(data: Record<string, any>): string {
    const parts: string[] = [];

    // Institution card
    if (data.institution && Object.keys(data.institution).length > 0) {
        parts.push(`
<Card>
  <CardHeader>
    <CardTitle>${escapeText(data.institution.name || 'Unknown Institution')}</CardTitle>
    <CardDescription>
      ${escapeText(data.institution.type || '')} ${data.institution.category ? `| ${escapeText(data.institution.category)}` : ''}
    </CardDescription>
  </CardHeader>
  <CardContent>
    ${data.institution.charter_year ? `**Chartered:** ${data.institution.charter_year}\n\n` : ''}
    ${data.institution.website_url ? `**Website:** [${escapeText(data.institution.website_url)}](${data.institution.website_url})\n\n` : ''}
    ${data.institution.county || data.institution.location ? `**Location:** ${escapeText([data.institution.county, data.institution.location].filter(Boolean).join(', '))}\n\n` : ''}
    ${data.institution.email || data.institution.phone ? `**Contact:** ${escapeText([data.institution.email, data.institution.phone].filter(Boolean).join(' | '))}` : ''}
  </CardContent>
</Card>
`);
    }

    // Programmes table
    if (data.programmes?.length > 0) {
        parts.push(`
### Available Programmes

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Programme</TableHead>
      <TableHead>Level</TableHead>
      <TableHead>Duration</TableHead>
      <TableHead>Min Grade</TableHead>
      <TableHead>Fees (KES)</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
${data.programmes.map((p: any) => `    <TableRow>
      <TableCell>${escapeText(p.name || 'N/A')}${p.source === 'supabase' ? ' ✓' : ''}</TableCell>
      <TableCell>${escapeText(p.level || 'N/A')}</TableCell>
      <TableCell>${p.duration_years ? `${p.duration_years} years` : 'N/A'}</TableCell>
      <TableCell>${escapeText(p.minimum_grade || 'N/A')}</TableCell>
      <TableCell>${formatFees(p.fees_min || p.fees_ksh_min, p.fees_max || p.fees_ksh_max)}</TableCell>
    </TableRow>`).join('\n')}
  </TableBody>
</Table>

${data.programmes.some((p: any) => p.source === 'supabase') ? '*✓ Verified from official records*' : ''}
`);
    }

    // Statistics chart
    if (data.statistics?.data?.length > 0) {
        const chartData = JSON.stringify(data.statistics.data);
        const chartConfig = JSON.stringify(data.statistics.config || {});

        parts.push(`
### Key Statistics

<ChartContainer config={${chartConfig}} className="h-64">
  <BarChart data={${chartData}}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="label" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
  </BarChart>
</ChartContainer>
`);
    }

    // Enrollment trend
    if (data.enrollmentTrend?.length > 0) {
        const trendData = JSON.stringify(data.enrollmentTrend);
        const trendConfig = JSON.stringify({ enrollment: { label: "Enrollment" } });

        parts.push(`
### Enrollment Trend

<ChartContainer config={${trendConfig}} className="h-64">
  <LineChart data={${trendData}}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="year" />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line type="monotone" dataKey="total_students" stroke="hsl(var(--primary))" strokeWidth={2} />
    <Line type="monotone" dataKey="male_students" stroke="hsl(var(--chart-2))" strokeWidth={2} />
    <Line type="monotone" dataKey="female_students" stroke="hsl(var(--chart-3))" strokeWidth={2} />
  </LineChart>
</ChartContainer>
`);
    }

    // Data quality footer
    if (parts.length > 0) {
        parts.push(`
---

### Data Quality

- **Last Updated:** ${new Date().toLocaleDateString()}
- **Verification Status:** ${data.verified ? '✅ Verified' : '⏳ Pending Verification'}
- **Confidence Score:** ${data.confidence ? `${(data.confidence * 100).toFixed(0)}%` : 'N/A'}

*Have updates or corrections? Let me know!*
`);
    }

    return parts.join('\n');
}

// Helper functions
function escapeText(text: string | undefined | null): string {
    if (!text) return 'N/A';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatFees(min?: number, max?: number): string {
    if (!min && !max) return 'N/A';
    if (!max || min === max) return min ? `${min.toLocaleString()}` : 'N/A';
    return `${min?.toLocaleString() || 0} - ${max.toLocaleString()}`;
}