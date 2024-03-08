from setuptools import setup, find_packages

setup(
    name='defense_sim',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        'pymongo',
        'numpy',
        # List your project's dependencies here.
        # Examples:
        # 'flask',
        # 'numpy',
    ],
    # Additional metadata about your package.
    author="Your Name",
    author_email="your.email@example.com",
    description="A package to simulate the impact of missiles on defense systems",
    # You can specify a list of classifiers here.
    # Check https://pypi.org/classifiers/ for a list.
)