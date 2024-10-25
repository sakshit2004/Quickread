import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TopHeadlines from './TopHeadlines';
import { MemoryRouter, Route } from 'react-router-dom';

// Mock fetch API
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            totalResults: 10,
            articles: [
              {
                title: 'Top Headline 1',
                description: 'Description for Top Headline 1',
                urlToImage: 'image-url-1.jpg',
                publishedAt: '2024-10-23',
                url: 'https://example.com/1',
                author: 'Author 1',
                source: { name: 'Source 1' },
              },
              {
                title: 'Top Headline 2',
                description: 'Description for Top Headline 2',
                urlToImage: 'image-url-2.jpg',
                publishedAt: '2024-10-22',
                url: 'https://example.com/2',
                author: 'Author 2',
                source: { name: 'Source 2' },
              },
            ],
          },
        }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

function renderTopHeadlinesWithRouter(params) {
  render(
    <MemoryRouter initialEntries={[`/top-headlines/${params.category}`]}>
      <Route path="/top-headlines/:category">
        <TopHeadlines />
      </Route>
    </MemoryRouter>
  );
}

describe('TopHeadlines Component', () => {
  it('should display a loading indicator while fetching top headlines', () => {
    renderTopHeadlinesWithRouter({ category: 'technology' });
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should render top headlines after fetching data', async () => {
    renderTopHeadlinesWithRouter({ category: 'technology' });

    await waitFor(() => {
      expect(screen.getByText('Top Headline 1')).toBeInTheDocument();
      expect(screen.getByText('Description for Top Headline 1')).toBeInTheDocument();
      expect(screen.getByText('Top Headline 2')).toBeInTheDocument();
      expect(screen.getByText('Description for Top Headline 2')).toBeInTheDocument();
    });
  });

  it('should display an error message if the API fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Failed to fetch top headlines'))
    );

    renderTopHeadlinesWithRouter({ category: 'technology' });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch news. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should handle pagination and fetch next set of articles when Next is clicked', async () => {
    renderTopHeadlinesWithRouter({ category: 'technology' });

    // Wait for initial articles to load
    await waitFor(() => {
      expect(screen.getByText('Top Headline 1')).toBeInTheDocument();
    });

    // Click on Next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Verify the fetch is called with the next page
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('should disable the Prev button when on the first page', async () => {
    renderTopHeadlinesWithRouter({ category: 'technology' });

    await waitFor(() => {
      expect(screen.getByText('Top Headline 1')).toBeInTheDocument();
    });

    const prevButton = screen.getByText('Prev');
    expect(prevButton).toBeDisabled();
  });

  it('should disable the Next button when on the last page', async () => {
    renderTopHeadlinesWithRouter({ category: 'technology' });

    await waitFor(() => {
      expect(screen.getByText('Top Headline 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(nextButton).toBeDisabled();
    });
  });
});